import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { withError } from "@/utils/middleware";
import {
  DEFAULT_KANBAN_COLUMNS,
  KanbanColumn,
  KanbanId,
  PersistedKanbanState,
} from "@/utils/emailKanban";

const userKanbanStore = new Map<string, PersistedKanbanState>();

export const GET = withError(async () => {
  const session = await auth();
  const userKey = session?.user?.email || "anonymous";
  const state = userKanbanStore.get(userKey) ?? {
    columns: [...DEFAULT_KANBAN_COLUMNS],
    assignments: {},
  };

  return NextResponse.json(state);
});

export const POST = withError(async (request: Request) => {
  const session = await auth();
  const userKey = session?.user?.email || "anonymous";
  const json = await request.json();

  const current = userKanbanStore.get(userKey) ?? {
    columns: [...DEFAULT_KANBAN_COLUMNS],
    assignments: {},
  };

  const columns: KanbanColumn[] = Array.isArray(json.columns)
    ? json.columns
    : current.columns;
  const assignments: Record<string, KanbanId> =
    json.assignments && typeof json.assignments === "object"
      ? { ...current.assignments, ...json.assignments }
      : current.assignments;

  const updated: PersistedKanbanState = { columns, assignments };
  userKanbanStore.set(userKey, updated);

  return NextResponse.json(updated);
});
