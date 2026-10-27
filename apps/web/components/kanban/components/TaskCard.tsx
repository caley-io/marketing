"use client";
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

function formatTaskRelativeDate(dateStr?: string): string {
  if (!dateStr) {
    return formatDistanceToNow(new Date(), { addSuffix: true });
  }
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) {
    return dateStr;
  }
  return formatDistanceToNow(parsed, { addSuffix: true });
}

function TaskCard({ task }: Props) {
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

  const senderName = task.senderName || "Unknown Sender";
  const subject = task.subject || task.content;
  const snippet = task.snippet || task.content;
  const labels = task.labels ?? [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex cursor-grab flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent"
    >
      <div className="flex w-full flex-col gap-1">
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <div className="font-semibold">{senderName}</div>
            {task.read === false && (
              <span className="flex h-2 w-2 rounded-full bg-blue-600" />
            )}
          </div>
          <div className={cn("ml-auto text-xs text-muted-foreground")}>
            {formatTaskRelativeDate(task.date)}
          </div>
        </div>
        <div className="text-xs font-medium">{subject}</div>
      </div>
      <div className="line-clamp-2 text-xs text-muted-foreground">{snippet}</div>

      {labels.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {labels
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
      )}
    </div>
  );
}

export default TaskCard;
