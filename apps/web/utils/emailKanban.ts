export type KanbanId = string | number;

export interface KanbanColumn {
  id: KanbanId;
  title: string;
}

export interface EmailMessageSummary {
  id?: string;
  name?: string;
  from?: string;
  subject?: string;
  snippet?: string;
  date?: string;
  read?: boolean;
  labels?: string[];
}

export interface EmailThreadInput {
  id: string;
  messages: EmailMessageSummary[];
}

export interface EmailKanbanCard {
  id: string;
  columnId: KanbanId;
  content: string;
  senderName: string;
  subject: string;
  snippet: string;
  date: string;
  read: boolean;
  labels: string[];
}

export interface PersistedKanbanState {
  columns: KanbanColumn[];
  assignments: Record<string, KanbanId>;
}

export const DEFAULT_COLUMN_ID = "backlog";

export const DEFAULT_KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: "backlog",
    title: "Backlog",
  },
  {
    id: "todo",
    title: "Todo",
  },
  {
    id: "doing",
    title: "In progress",
  },
  {
    id: "done",
    title: "Done",
  },
];

export const KANBAN_STORAGE_KEY = "caley_email_kanban_state";

/**
 * Adds a new custom column to the Kanban board.
 */
export function addKanbanColumn(
  columns: KanbanColumn[],
  title?: string,
  id?: KanbanId,
): KanbanColumn[] {
  const resolvedTitle = title?.trim() || `Column ${columns.length + 1}`;
  const resolvedId =
    id ??
    `${resolvedTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "col"}-${columns.length + 1}`;

  return [
    ...columns,
    {
      id: resolvedId,
      title: resolvedTitle,
    },
  ];
}

/**
 * Renames an existing column and returns the updated columns list.
 */
export function renameKanbanColumn(
  columns: KanbanColumn[],
  columnId: KanbanId,
  newTitle: string,
): KanbanColumn[] {
  return columns.map((col) => {
    if (col.id !== columnId) return col;
    return {
      ...col,
      title: newTitle,
    };
  });
}

/**
 * Reorders columns by moving the item at fromIndex to toIndex.
 */
export function reorderKanbanColumns<T>(
  items: T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length ||
    fromIndex === toIndex
  ) {
    return [...items];
  }
  const result = [...items];
  const [moved] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, moved);
  return result;
}

/**
 * Synchronizes an email's label list so that moving an email to a column
 * replaces any previous column status label with the target column's label.
 */
export function syncCardLabelsWithColumn(
  existingLabels: string[],
  columns: KanbanColumn[],
  targetColumnId: KanbanId,
): string[] {
  const targetColumn = columns.find((col) => col.id === targetColumnId);
  if (!targetColumn) return [...existingLabels];

  const columnNamesLower = new Set(
    columns.flatMap((col) => [
      String(col.id).toLowerCase(),
      col.title.toLowerCase(),
    ]),
  );

  const filtered = existingLabels.filter(
    (label) => !columnNamesLower.has(label.toLowerCase()),
  );

  return [...filtered, targetColumn.title];
}

/**
 * Deletes a column and reassigns any emails in that column to the fallback column (Backlog).
 */
export function deleteKanbanColumn(
  columns: KanbanColumn[],
  cards: EmailKanbanCard[],
  assignments: Record<string, KanbanId>,
  columnId: KanbanId,
): {
  columns: KanbanColumn[];
  cards: EmailKanbanCard[];
  assignments: Record<string, KanbanId>;
} {
  const remainingColumns = columns.filter((col) => col.id !== columnId);
  const fallbackColumnId =
    remainingColumns.find((col) => col.id === DEFAULT_COLUMN_ID)?.id ??
    remainingColumns[0]?.id ??
    DEFAULT_COLUMN_ID;

  const nextAssignments: Record<string, KanbanId> = { ...assignments };
  const nextCards = cards.map((card) => {
    if (card.columnId !== columnId) return card;
    nextAssignments[card.id] = fallbackColumnId;
    return {
      ...card,
      columnId: fallbackColumnId,
      labels: syncCardLabelsWithColumn(
        card.labels,
        columns,
        fallbackColumnId,
      ),
    };
  });

  return {
    columns: remainingColumns,
    cards: nextCards,
    assignments: nextAssignments,
  };
}

/**
 * Resolves which column an email thread belongs to.
 * Defaults to 'backlog' for newly received emails without an explicit assignment or matching column label.
 */
export function resolveThreadColumnId(
  threadId: string,
  threadLabels: string[],
  columns: KanbanColumn[],
  assignments: Record<string, KanbanId>,
): KanbanId {
  const assigned = assignments[threadId];
  if (assigned !== undefined && columns.some((col) => col.id === assigned)) {
    return assigned;
  }

  for (const label of threadLabels) {
    const lower = label.toLowerCase();
    const matched = columns.find(
      (col) =>
        String(col.id).toLowerCase() === lower ||
        col.title.toLowerCase() === lower,
    );
    if (matched) {
      return matched.id;
    }
  }

  const backlogCol = columns.find((col) => col.id === DEFAULT_COLUMN_ID);
  return backlogCol ? backlogCol.id : columns[0]?.id ?? DEFAULT_COLUMN_ID;
}

/**
 * Maps Gmail threads into EmailKanbanCards, placing unassigned emails in Backlog by default.
 */
export function mapThreadsToKanbanCards(
  threads: EmailThreadInput[],
  columns: KanbanColumn[] = DEFAULT_KANBAN_COLUMNS,
  assignments: Record<string, KanbanId> = {},
): EmailKanbanCard[] {
  if (!Array.isArray(threads)) return [];

  return threads.map((thread) => {
    const firstMsg = thread.messages?.[0] ?? {};
    const lastMsg = thread.messages?.[thread.messages.length - 1] ?? firstMsg;
    const rawLabels = Array.isArray(firstMsg.labels) ? firstMsg.labels : [];
    const columnId = resolveThreadColumnId(
      thread.id,
      rawLabels,
      columns,
      assignments,
    );

    const senderName = (firstMsg.name || firstMsg.from || "Unknown Sender")
      .replace(/"/g, "")
      .trim();
    const subject = firstMsg.subject || "(No subject)";
    const snippet = lastMsg.snippet || firstMsg.snippet || "";
    const date = lastMsg.date || firstMsg.date || new Date().toISOString();
    const read = Boolean(lastMsg.read ?? firstMsg.read ?? false);
    const labels = syncCardLabelsWithColumn(rawLabels, columns, columnId);

    return {
      id: thread.id,
      columnId,
      content: subject,
      senderName,
      subject,
      snippet,
      date,
      read,
      labels,
    };
  });
}

/**
 * Moves an email card to a target column (and optional index) and synchronizes its column label.
 */
export function moveEmailCardToColumn(
  cards: EmailKanbanCard[],
  columns: KanbanColumn[],
  assignments: Record<string, KanbanId>,
  cardId: KanbanId,
  targetColumnId: KanbanId,
  targetIndex?: number,
): {
  cards: EmailKanbanCard[];
  assignments: Record<string, KanbanId>;
} {
  const activeIndex = cards.findIndex((c) => c.id === String(cardId));
  if (activeIndex === -1) {
    return { cards: [...cards], assignments: { ...assignments } };
  }

  const currentCard = cards[activeIndex];
  const updatedCard: EmailKanbanCard = {
    ...currentCard,
    columnId: targetColumnId,
    labels: syncCardLabelsWithColumn(
      currentCard.labels,
      columns,
      targetColumnId,
    ),
  };

  let nextCards = cards.map((card, idx) =>
    idx === activeIndex ? updatedCard : card,
  );

  if (
    typeof targetIndex === "number" &&
    targetIndex >= 0 &&
    targetIndex < nextCards.length
  ) {
    nextCards = reorderKanbanColumns(nextCards, activeIndex, targetIndex);
  }

  const nextAssignments: Record<string, KanbanId> = {
    ...assignments,
    [String(cardId)]: targetColumnId,
  };

  return {
    cards: nextCards,
    assignments: nextAssignments,
  };
}

function getStorage(): Storage | null {
  try {
    if (
      typeof globalThis !== "undefined" &&
      "localStorage" in globalThis &&
      globalThis.localStorage
    ) {
      return globalThis.localStorage;
    }
  } catch {
    // Ignore storage access errors in SSR/restricted environments
  }
  return null;
}

export function loadKanbanStateFromStorage(): PersistedKanbanState {
  const storage = getStorage();
  if (!storage) {
    return {
      columns: [...DEFAULT_KANBAN_COLUMNS],
      assignments: {},
    };
  }

  try {
    const raw = storage.getItem(KANBAN_STORAGE_KEY);
    if (!raw) {
      return {
        columns: [...DEFAULT_KANBAN_COLUMNS],
        assignments: {},
      };
    }

    const parsed = JSON.parse(raw) as Partial<PersistedKanbanState>;
    const columns =
      Array.isArray(parsed.columns) && parsed.columns.length > 0
        ? parsed.columns
        : [...DEFAULT_KANBAN_COLUMNS];
    const assignments =
      parsed.assignments && typeof parsed.assignments === "object"
        ? parsed.assignments
        : {};

    return { columns, assignments };
  } catch {
    return {
      columns: [...DEFAULT_KANBAN_COLUMNS],
      assignments: {},
    };
  }
}

export function saveKanbanStateToStorage(state: PersistedKanbanState): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(KANBAN_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage write errors
  }
}
