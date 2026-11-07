"use client";
import { PlusIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Column, Id, Task } from "../data";
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
import { SortableContext } from "@dnd-kit/sortable";
import { useAtomValue } from "jotai";
import { threadsAtom } from "@/utils/store";
import {
  EmailThreadInput,
  addKanbanColumn,
  deleteKanbanColumn,
  loadKanbanStateFromStorage,
  mapThreadsToKanbanCards,
  moveEmailCardToColumn,
  renameKanbanColumn,
  reorderKanbanColumns,
  saveKanbanStateToStorage,
  syncCardLabelsWithColumn,
} from "@/utils/emailKanban";

import TaskCard from "./TaskCard";

interface KanbanBoardProps {
  threads?: EmailThreadInput[];
}

function KanbanBoard({ threads: propThreads }: KanbanBoardProps) {
  const storeThreadsData = useAtomValue(threadsAtom);
  const resolvedThreads: EmailThreadInput[] = useMemo(() => {
    if (Array.isArray(propThreads)) return propThreads;
    if (Array.isArray(storeThreadsData?.threads)) {
      return storeThreadsData.threads;
    }
    return [];
  }, [propThreads, storeThreadsData]);

  const initialPersisted = useMemo(() => loadKanbanStateFromStorage(), []);

  const [columns, setColumns] = useState<Column[]>(initialPersisted.columns);
  const [assignments, setAssignments] = useState<Record<string, Id>>(
    initialPersisted.assignments,
  );
  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

  const [tasks, setTasks] = useState<Task[]>(() =>
    mapThreadsToKanbanCards(
      resolvedThreads,
      initialPersisted.columns,
      initialPersisted.assignments,
    ),
  );

  useEffect(() => {
    setTasks(mapThreadsToKanbanCards(resolvedThreads, columns, assignments));
  }, [resolvedThreads, columns, assignments]);

  useEffect(() => {
    saveKanbanStateToStorage({ columns, assignments });
    fetch("/api/mail/kanban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columns, assignments }),
    }).catch(() => {
      // Ignore network sync errors when offline
    });
  }, [columns, assignments]);

  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

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
            className="flex h-[60px] w-[350px] min-w-[350px] cursor-pointer gap-2 p-4 hover:ring-2"
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
    const newId = String(generateId());
    const newTask: Task = {
      id: newId,
      columnId,
      content: `Email ${tasks.length + 1}`,
      senderName: "Draft",
      subject: `Email ${tasks.length + 1}`,
      snippet: "",
      date: new Date().toISOString(),
      read: true,
      labels: syncCardLabelsWithColumn([], columns, columnId),
    };

    setTasks([...tasks, newTask]);
  }

  function deleteTask(id: Id) {
    const newTasks = tasks.filter((task) => task.id !== String(id));
    setTasks(newTasks);
  }

  function updateTask(id: Id, content: string) {
    const newTasks = tasks.map((task) => {
      if (task.id !== String(id)) return task;
      return { ...task, content, subject: content };
    });

    setTasks(newTasks);
  }

  function createNewColumn() {
    setColumns((prev) => addKanbanColumn(prev));
  }

  function deleteColumn(id: Id) {
    const result = deleteKanbanColumn(columns, tasks, assignments, id);
    setColumns(result.columns);
    setTasks(result.cards);
    setAssignments(result.assignments);
  }

  function updateColumn(id: Id, title: string) {
    const nextCols = renameKanbanColumn(columns, id, title);
    setColumns(nextCols);
    setTasks((prev) =>
      prev.map((card) =>
        card.columnId === id
          ? {
              ...card,
              labels: syncCardLabelsWithColumn(card.labels, nextCols, id),
            }
          : card,
      ),
    );
  }

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "Column") {
      setActiveColumn(event.active.data.current.column);
      return;
    }

    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task);
      return;
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveColumn(null);
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveAColumn = active.data.current?.type === "Column";
    if (!isActiveAColumn) return;

    setColumns((prev) => {
      const activeColumnIndex = prev.findIndex((col) => col.id === activeId);
      const overColumnIndex = prev.findIndex((col) => col.id === overId);
      return reorderKanbanColumns(prev, activeColumnIndex, overColumnIndex);
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
      const overTask = tasks.find((t) => t.id === String(overId));
      const overIndex = tasks.findIndex((t) => t.id === String(overId));
      if (!overTask) return;

      const moved = moveEmailCardToColumn(
        tasks,
        columns,
        assignments,
        activeId,
        overTask.columnId,
        overIndex,
      );
      setTasks(moved.cards);
      setAssignments(moved.assignments);
      return;
    }

    const isOverAColumn = over.data.current?.type === "Column";

    if (isActiveATask && isOverAColumn) {
      const moved = moveEmailCardToColumn(
        tasks,
        columns,
        assignments,
        activeId,
        overId,
      );
      setTasks(moved.cards);
      setAssignments(moved.assignments);
    }
  }
}

function generateId() {
  return Math.floor(Math.random() * 10001);
}

export default KanbanBoard;
