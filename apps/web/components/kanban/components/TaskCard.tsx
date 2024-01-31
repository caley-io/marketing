"use client";
import { useState } from "react";
import { TrashIcon } from "lucide-react";
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

function TaskCard({ task, deleteTask, updateTask }: Props) {
  const [mouseIsOver, setMouseIsOver] = useState(false);
  const [editMode, setEditMode] = useState(false);

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

  const toggleEditMode = () => {
    setEditMode((prev) => !prev);
    setMouseIsOver(false);
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="
        relative flex h-[100px] min-h-[100px] cursor-grab items-center rounded-xl border border-rose-500 bg-background p-2.5 text-left opacity-30
      "
      />
    );
  }

  if (editMode) {
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
              <div className="font-semibold">Jeremy Scatigna</div>

              <span className="flex h-2 w-2 rounded-full bg-blue-600" />
            </div>
            <div className={cn("ml-auto text-xs text-muted-foreground")}>
              {formatDistanceToNow(new Date(), {
                addSuffix: true,
              })}
            </div>
          </div>
          <div className="text-xs font-medium">
            🗞 What's New: Making a living from open source projects
          </div>
        </div>
      </div>
    );
  }

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
            <div className="font-semibold">Jeremy Scatigna</div>

            <span className="flex h-2 w-2 rounded-full bg-blue-600" />
          </div>
          <div className={cn("ml-auto text-xs text-muted-foreground")}>
            {formatDistanceToNow(new Date(), {
              addSuffix: true,
            })}
          </div>
        </div>
        <div className="text-xs font-medium">
          🗞 What's New: Making a living from open source projects
        </div>
      </div>
      <div className="line-clamp-2 text-xs text-muted-foreground">
        Read the best news on open source and Indie Hacking
      </div>

      <div className="flex items-center gap-2">
        {["Inbox", "Important"]
          .filter(
            (label) =>
              !label.toLowerCase().includes("unread") &&
              !label.toLowerCase().includes("label_"),
          )
          .map((label) => (
            <Badge key={label} variant={getBadgeVariantFromLabel(label)}>
              {getBadgeTextFormatted(label)}
            </Badge>
          ))}
      </div>
    </div>
  );
}

export default TaskCard;
