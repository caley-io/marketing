"use client";
import { useState } from "react";
import { Id, Task } from "../data";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/utils";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  getBadgeTextFormatted,
  getBadgeVariantFromLabel,
} from "@/components/mail/components/mail-list";

interface Props {
  task: Task;
  deleteTask: (id: Id) => void;
  updateTask: (id: Id, content: string) => void;
}

function TaskCard({ task }: Props) {
  const [editMode] = useState(false);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
    disabled: editMode,
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="relative flex h-[100px] min-h-[100px] cursor-grab items-center rounded-xl border border-rose-500 bg-background p-2.5 text-left opacity-30"
      />
    );
  }

  const parsedDate = task.date ? new Date(task.date) : new Date();
  const validDate = Number.isNaN(parsedDate.getTime())
    ? new Date()
    : parsedDate;

  const visibleLabels = (task.labels ?? []).filter(
    (label) =>
      !label.toLowerCase().includes("unread") &&
      !label.toLowerCase().includes("label_"),
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent"
    >
      <div className="flex w-full flex-col gap-1">
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <div className="font-semibold">
              {task.senderName || "Unknown Sender"}
            </div>

            {!task.read && (
              <span className="flex h-2 w-2 rounded-full bg-blue-600" />
            )}
          </div>
          <div className={cn("ml-auto text-xs text-muted-foreground")}>
            {formatDistanceToNow(validDate, {
              addSuffix: true,
            })}
          </div>
        </div>
        <div className="text-xs font-medium">
          {task.subject || task.content}
        </div>
      </div>
      {task.snippet && (
        <div className="line-clamp-2 text-xs text-muted-foreground">
          {task.snippet}
        </div>
      )}

      {visibleLabels.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {visibleLabels.map((label) => (
            <Badge key={label} variant={getBadgeVariantFromLabel(label)}>
              {getBadgeTextFormatted(label)}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default TaskCard;
