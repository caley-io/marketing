export const defaultCols: Column[] = [
  {
    id: "backlog",
    title: "Backlog",
  },
  {
    id: "todo",
    title: "Todo",
  },
  {
    id: "in-progress",
    title: "In progress",
  },
  {
    id: "done",
    title: "Done",
  },
];

export type Id = string | number;

export type Column = {
  id: Id;
  title: string;
};

export type Task = {
  id: Id;
  columnId: Id;
  content: string;
  senderName?: string;
  subject?: string;
  snippet?: string;
  date?: string;
  read?: boolean;
  labels?: string[];
};

export const defaultTasks: Task[] = [];
