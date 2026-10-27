"use client";
import { PlusIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Column, Id, Task, defaultCols } from "../data";
import * as Portal from "@radix-ui/react-portal";
import ColumnContainer from "./ColumnContainer";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { useAtom } from "jotai";
import { threadsAtom } from "@/utils/store";
import { GMailThread } from "@/utils/gmail/types";
import { postRequest } from "@/utils/api";

import TaskCard from "./TaskCard";

const KANBAN_COLUMNS_STORAGE_KEY = "caley:kanban:columns";
const KANBAN_THREAD_LABELS_STORAGE_KEY = "caley:kanban:thread-labels";

interface KanbanBoardProps {
  threads?: GMailThread[];
}

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase();
}

function loadStoredColumns(): Column[] {
  if (typeof window === "undefined") return defaultCols;
  try {
    const raw = window.localStorage.getItem(KANBAN_COLUMNS_STORAGE_KEY);
    if (!raw) return defaultCols;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // ignore storage errors
  }
  return defaultCols;
}

function loadStoredThreadLabels(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KANBAN_THREAD_LABELS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, string>;
    }
  } catch {
    // ignore storage errors
  }
  return {};
}

function resolveColumnForLabels(
  labels: string[],
  columns: Column[],
  storedLabel?: string,
): Column {
  const backlogColumn =
    columns.find((col) => String(col.id) === "backlog") ?? columns[0];

  const candidateLabels = storedLabel ? [storedLabel, ...labels] : labels;

  for (const rawLabel of candidateLabels) {
    const normalized = normalizeLabel(rawLabel);
    const matched = columns.find(
      (col) =>
        normalizeLabel(col.title) === normalized ||
        normalizeLabel(String(col.id)) === normalized,
    );
    if (matched) {
      return matched;
    }
  }

  return backlogColumn;
}

async function syncThreadColumnLabelWithGmail(
  threadId: string,
  columnTitle: string,
): Promise<void> {
  try {
    const labelsRes = await fetch("/api/google/labels");
    if (!labelsRes.ok) return;
    const labelsData = await labelsRes.json();
    const existingLabels: Array<{ id?: string; name?: string }> =
      labelsData?.labels ?? [];

    let matchedLabel = existingLabels.find(
      (label) =>
        label.name &&
        normalizeLabel(label.name) === normalizeLabel(columnTitle),
    );

    if (!matchedLabel?.id) {
      const created = await postRequest<{ label?: { id?: string } }>(
        "/api/google/labels/create",
        { name: columnTitle },
      );
      if (created && "label" in created && created.label?.id) {
        matchedLabel = { id: created.label.id, name: columnTitle };
      }
    }

    if (matchedLabel?.id) {
      await postRequest("/api/google/threads/label", {
        threadId,
        labelId: matchedLabel.id,
        archive: false,
      });
    }
  } catch {
    // Offline or unauthenticated sessions still persist via state + localStorage
  }
}

function KanbanBoard({ threads: propThreads }: KanbanBoardProps) {
  const [atomThreadsData, setAtomThreadsData] = useAtom(threadsAtom);
  const [columns, setColumns] = useState<Column[]>(() => loadStoredColumns());
  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const dragInitialColumnRef = useRef<Id | null>(null);

  const sourceThreads: GMailThread[] = useMemo(() => {
    if (propThreads && propThreads.length > 0) return propThreads;
    return atomThreadsData?.threads ?? [];
  }, [propThreads, atomThreadsData]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        KANBAN_COLUMNS_STORAGE_KEY,
        JSON.stringify(columns),
      );
    } catch {
      // ignore storage errors
    }
  }, [columns]);

  useEffect(() => {
    const storedThreadLabels = loadStoredThreadLabels();
    const mappedTasks: Task[] = sourceThreads.map((thread) => {
      const firstMessage = thread.messages?.[0];
      const lastMessage = thread.messages?.[thread.messages.length - 1];
      const messageLabels = Array.from(
        new Set(
          (thread.messages ?? []).flatMap((msg) => msg.labels ?? []),
        ),
      );
      const storedLabel = storedThreadLabels[thread.id];
      const matchedColumn = resolveColumnForLabels(
        messageLabels,
        columns,
        storedLabel,
      );

      const columnTitle = matchedColumn?.title ?? "Backlog";
      const columnTitleSet = new Set(
        columns.map((col) => normalizeLabel(col.title)),
      );
      const nonColumnLabels = messageLabels.filter(
        (label) => !columnTitleSet.has(normalizeLabel(label)),
      );
      const mergedLabels = [...nonColumnLabels, columnTitle];

      return {
        id: thread.id,
        columnId: matchedColumn?.id ?? "backlog",
        content: firstMessage?.subject || thread.snippet || "No subject",
        senderName: (firstMessage?.name || firstMessage?.email || "Unknown")
          .replace(/"/g, "")
          .trim(),
        subject: firstMessage?.subject || "(No subject)",
        snippet: thread.snippet || firstMessage?.snippet || "",
        date: lastMessage?.date || firstMessage?.date,
        read: lastMessage ? Boolean(lastMessage.read) : true,
        labels: mergedLabels,
      };
    });

    setTasks(mappedTasks);
  }, [sourceThreads, columns]);

  const applyTaskColumnLabel = useCallback(
    (taskId: Id, targetColumnId: Id) => {
      const targetColumn = columns.find((col) => col.id === targetColumnId);
      if (!targetColumn) return;

      const columnTitleSet = new Set(
        columns.map((col) => normalizeLabel(col.title)),
      );
      const threadId = String(taskId);

      if (typeof window !== "undefined") {
        try {
          const currentMap = loadStoredThreadLabels();
          currentMap[threadId] = targetColumn.title;
          window.localStorage.setItem(
            KANBAN_THREAD_LABELS_STORAGE_KEY,
            JSON.stringify(currentMap),
          );
        } catch {
          // ignore storage errors
        }
      }

      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== taskId) return task;
          const filteredLabels = (task.labels ?? []).filter(
            (label) => !columnTitleSet.has(normalizeLabel(label)),
          );
          return {
            ...task,
            columnId: targetColumn.id,
            labels: [...filteredLabels, targetColumn.title],
          };
        }),
      );

      if (atomThreadsData?.threads) {
        setAtomThreadsData({
          ...atomThreadsData,
          threads: atomThreadsData.threads.map((thread: GMailThread) => {
            if (thread.id !== threadId) return thread;
            return {
              ...thread,
              messages: thread.messages.map((message, index) => {
                if (index !== 0) return message;
                const filteredLabels = (message.labels ?? []).filter(
                  (label) => !columnTitleSet.has(normalizeLabel(label)),
                );
                return {
                  ...message,
                  labels: [...filteredLabels, targetColumn.title],
                };
              }),
            };
          }),
        });
      }

      void syncThreadColumnLabelWithGmail(threadId, targetColumn.title);
    },
    [columns, atomThreadsData, setAtomThreadsData],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
  );

  return (
    <div className="flex min-h-screen w-full items-center overflow-x-auto overflow-y-hidden">
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
      >
        <div className="flex h-screen w-full gap-4">
          <div className="flex gap-4">
            <SortableContext items={columnsId}>
              {columns.map((col) => (
                <ColumnContainer
                  key={col.id}
                  column={col}
                  deleteColumn={deleteColumn}
                  updateColumn={updateColumn}
                  createTask={createTask}
                  deleteTask={deleteTask}
                  updateTask={updateTask}
                  tasks={tasks.filter((task) => task.columnId === col.id)}
                />
              ))}
            </SortableContext>
          </div>
          <button
            onClick={() => {
              createNewColumn();
            }}
            className="flex h-[60px] w-[350px] min-w-[350px] cursor-pointer gap-2 rounded-md border p-4 hover:ring-2"
          >
            <PlusIcon />
            Add Column
          </button>
        </div>
        <Portal.Root asChild>
          <DragOverlay>
            {activeColumn && (
              <ColumnContainer
                column={activeColumn}
                deleteColumn={deleteColumn}
                updateColumn={updateColumn}
                createTask={createTask}
                deleteTask={deleteTask}
                updateTask={updateTask}
                tasks={tasks.filter(
                  (task) => task.columnId === activeColumn.id,
                )}
              />
            )}
            {activeTask && (
              <TaskCard
                task={activeTask}
                deleteTask={deleteTask}
                updateTask={updateTask}
              />
            )}
          </DragOverlay>
        </Portal.Root>
      </DndContext>
    </div>
  );

  function createTask(columnId: Id) {
    const targetColumn = columns.find((col) => col.id === columnId);
    const newTask: Task = {
      id: generateId(),
      columnId,
      content: `Task ${tasks.length + 1}`,
      labels: targetColumn ? [targetColumn.title] : [],
    };

    setTasks([...tasks, newTask]);
  }

  function deleteTask(id: Id) {
    const newTasks = tasks.filter((task) => task.id !== id);
    setTasks(newTasks);
  }

  function updateTask(id: Id, content: string) {
    const newTasks = tasks.map((task) => {
      if (task.id !== id) return task;
      return { ...task, content };
    });

    setTasks(newTasks);
  }

  function createNewColumn() {
    const columnToAdd: Column = {
      id: `col-${generateId()}`,
      title: `Column ${columns.length + 1}`,
    };

    setColumns([...columns, columnToAdd]);
  }

  function deleteColumn(id: Id) {
    const filteredColumns = columns.filter((col) => col.id !== id);
    setColumns(filteredColumns);

    const fallbackColumnId = filteredColumns[0]?.id ?? "backlog";
    setTasks((prev) =>
      prev.map((task) =>
        task.columnId === id ? { ...task, columnId: fallbackColumnId } : task,
      ),
    );
  }

  function updateColumn(id: Id, title: string) {
    const previousColumn = columns.find((col) => col.id === id);
    const newColumns = columns.map((col) => {
      if (col.id !== id) return col;
      return { ...col, title };
    });

    setColumns(newColumns);

    if (previousColumn && title.trim() !== "") {
      const prevNormalized = normalizeLabel(previousColumn.title);
      setTasks((prev) =>
        prev.map((task) => {
          if (task.columnId !== id) return task;
          const filtered = (task.labels ?? []).filter(
            (label) => normalizeLabel(label) !== prevNormalized,
          );
          return {
            ...task,
            labels: [...filtered, title],
          };
        }),
      );

      if (typeof window !== "undefined") {
        try {
          const currentMap = loadStoredThreadLabels();
          for (const [threadId, storedTitle] of Object.entries(currentMap)) {
            if (normalizeLabel(storedTitle) === prevNormalized) {
              currentMap[threadId] = title;
            }
          }
          window.localStorage.setItem(
            KANBAN_THREAD_LABELS_STORAGE_KEY,
            JSON.stringify(currentMap),
          );
        } catch {
          // ignore storage errors
        }
      }
    }
  }

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "Column") {
      setActiveColumn(event.active.data.current.column);
      return;
    }

    if (event.active.data.current?.type === "Task") {
      const task = event.active.data.current.task as Task;
      setActiveTask(task);
      dragInitialColumnRef.current = task.columnId;
      return;
    }
  }

  function onDragEnd(event: DragEndEvent) {
    const draggedTask = activeTask;
    const initialColumnId = dragInitialColumnRef.current;

    setActiveColumn(null);
    setActiveTask(null);
    dragInitialColumnRef.current = null;

    const { active, over } = event;

    if (draggedTask) {
      const currentTask = tasks.find((t) => t.id === draggedTask.id);
      const finalColumnId = currentTask?.columnId ?? draggedTask.columnId;
      if (finalColumnId && finalColumnId !== initialColumnId) {
        applyTaskColumnLabel(draggedTask.id, finalColumnId);
      }
      return;
    }

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveAColumn = active.data.current?.type === "Column";
    if (!isActiveAColumn) return;

    setColumns((columns) => {
      const activeColumnIndex = columns.findIndex((col) => col.id === activeId);
      const overColumnIndex = columns.findIndex((col) => col.id === overId);

      return arrayMove(columns, activeColumnIndex, overColumnIndex);
    });
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === "Task";
    const isOverATask = over.data.current?.type === "Task";

    if (!isActiveATask) return;

    if (isActiveATask && isOverATask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const overIndex = tasks.findIndex((t) => t.id === overId);
        if (activeIndex === -1 || overIndex === -1) return tasks;

        const nextTasks = [...tasks];
        if (nextTasks[activeIndex].columnId !== nextTasks[overIndex].columnId) {
          nextTasks[activeIndex] = {
            ...nextTasks[activeIndex],
            columnId: nextTasks[overIndex].columnId,
          };
          return arrayMove(
            nextTasks,
            activeIndex,
            Math.max(0, overIndex - 1),
          );
        }

        return arrayMove(nextTasks, activeIndex, overIndex);
      });
    }

    const isOverAColumn = over.data.current?.type === "Column";

    if (isActiveATask && isOverAColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        if (activeIndex === -1) return tasks;

        const nextTasks = [...tasks];
        nextTasks[activeIndex] = {
          ...nextTasks[activeIndex],
          columnId: overId,
        };
        return arrayMove(nextTasks, activeIndex, activeIndex);
      });
    }
  }
}

function generateId() {
  return Math.floor(Math.random() * 10001);
}

export default KanbanBoard;
