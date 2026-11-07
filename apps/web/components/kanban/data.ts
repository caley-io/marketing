import {
  DEFAULT_KANBAN_COLUMNS,
  EmailKanbanCard,
  KanbanColumn,
  KanbanId,
} from "@/utils/emailKanban";

export type Id = KanbanId;
export type Column = KanbanColumn;
export type Task = EmailKanbanCard;

export const defaultCols: Column[] = DEFAULT_KANBAN_COLUMNS;

export const defaultTasks: Task[] = [];
