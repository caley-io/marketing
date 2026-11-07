import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_KANBAN_COLUMNS,
  KANBAN_STORAGE_KEY,
  type EmailThreadInput,
  addKanbanColumn,
  deleteKanbanColumn,
  loadKanbanStateFromStorage,
  mapThreadsToKanbanCards,
  moveEmailCardToColumn,
  renameKanbanColumn,
  reorderKanbanColumns,
  saveKanbanStateToStorage,
} from "../utils/emailKanban.ts";

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

describe("Email Kanban Board Engine (Issue #14)", () => {
  let mockStorage: MemoryStorage;

  const sampleThreads: EmailThreadInput[] = [
    {
      id: "thread_1",
      messages: [
        {
          name: '"Alice Johnson"',
          subject: "Q1 Marketing Strategy",
          snippet: "Let us review the Q1 campaign budget",
          date: "2026-01-10T10:00:00.000Z",
          read: false,
          labels: ["INBOX", "Work"],
        },
      ],
    },
    {
      id: "thread_2",
      messages: [
        {
          name: "Bob Smith",
          subject: "Sponsor Invoice",
          snippet: "Attached is the invoice for the newsletter slot",
          date: "2026-01-11T12:00:00.000Z",
          read: true,
          labels: ["INBOX", "Important"],
        },
      ],
    },
  ];

  beforeEach(() => {
    mockStorage = new MemoryStorage();
    Object.defineProperty(globalThis, "localStorage", {
      value: mockStorage,
      configurable: true,
      writable: true,
    });
  });

  it("initializes with the 4 default columns: Backlog, Todo, In progress, Done", () => {
    assert.equal(DEFAULT_KANBAN_COLUMNS.length, 4);
    assert.deepEqual(
      DEFAULT_KANBAN_COLUMNS.map((c) => c.title),
      ["Backlog", "Todo", "In progress", "Done"],
    );
  });

  it("populates newly received emails in Backlog by default with Backlog label synced", () => {
    const cards = mapThreadsToKanbanCards(sampleThreads);
    assert.equal(cards.length, 2);

    assert.equal(cards[0].id, "thread_1");
    assert.equal(cards[0].columnId, "backlog");
    assert.equal(cards[0].senderName, "Alice Johnson");
    assert.equal(cards[0].subject, "Q1 Marketing Strategy");
    assert.ok(cards[0].labels.includes("Backlog"));

    assert.equal(cards[1].id, "thread_2");
    assert.equal(cards[1].columnId, "backlog");
    assert.ok(cards[1].labels.includes("Backlog"));
  });

  it("supports adding, renaming, reordering, and deleting custom columns", () => {
    let cols = [...DEFAULT_KANBAN_COLUMNS];

    // Add a custom column
    cols = addKanbanColumn(cols, "Waiting on Reply", "waiting");
    assert.equal(cols.length, 5);
    assert.deepEqual(cols[4], { id: "waiting", title: "Waiting on Reply" });

    // Rename a column
    cols = renameKanbanColumn(cols, "doing", "Active Review");
    assert.equal(cols.find((c) => c.id === "doing")?.title, "Active Review");

    // Reorder columns
    cols = reorderKanbanColumns(cols, 4, 1);
    assert.equal(cols[1].id, "waiting");

    // Move thread_1 into "waiting" then delete "waiting" -> reassigns to Backlog
    const initialCards = mapThreadsToKanbanCards(sampleThreads, cols, {
      thread_1: "waiting",
    });
    assert.equal(initialCards[0].columnId, "waiting");

    const afterDelete = deleteKanbanColumn(
      cols,
      initialCards,
      { thread_1: "waiting" },
      "waiting",
    );
    assert.equal(afterDelete.columns.length, 4);
    assert.equal(afterDelete.cards[0].columnId, "backlog");
    assert.ok(afterDelete.cards[0].labels.includes("Backlog"));
    assert.ok(!afterDelete.cards[0].labels.includes("Waiting on Reply"));
  });

  it("moves emails between columns and replaces the previous column label with the new column label", () => {
    const cols = [...DEFAULT_KANBAN_COLUMNS];
    let cards = mapThreadsToKanbanCards(sampleThreads, cols, {});
    let assignments = {};

    // Move thread_1 from Backlog -> In progress ("doing")
    const step1 = moveEmailCardToColumn(
      cards,
      cols,
      assignments,
      "thread_1",
      "doing",
    );
    cards = step1.cards;
    assignments = step1.assignments;

    const movedCard = cards.find((c) => c.id === "thread_1")!;
    assert.equal(movedCard.columnId, "doing");
    assert.equal(assignments["thread_1" as keyof typeof assignments], "doing");
    assert.ok(movedCard.labels.includes("In progress"));
    assert.ok(!movedCard.labels.includes("Backlog"));
    assert.ok(movedCard.labels.includes("Work"));

    // Move thread_1 from In progress -> Done ("done")
    const step2 = moveEmailCardToColumn(
      cards,
      cols,
      assignments,
      "thread_1",
      "done",
    );
    const doneCard = step2.cards.find((c) => c.id === "thread_1")!;
    assert.equal(doneCard.columnId, "done");
    assert.ok(doneCard.labels.includes("Done"));
    assert.ok(!doneCard.labels.includes("In progress"));
  });

  it("persists and hydrates Kanban columns and email assignments via localStorage", () => {
    const customCols = addKanbanColumn(
      DEFAULT_KANBAN_COLUMNS,
      "Follow Up",
      "follow-up",
    );
    const customAssignments = {
      thread_1: "follow-up",
      thread_2: "done",
    };

    saveKanbanStateToStorage({
      columns: customCols,
      assignments: customAssignments,
    });

    const loaded = loadKanbanStateFromStorage();
    assert.equal(loaded.columns.length, 5);
    assert.equal(loaded.columns[4].title, "Follow Up");
    assert.deepEqual(loaded.assignments, customAssignments);

    // Malformed storage falls back to defaults safely
    mockStorage.setItem(KANBAN_STORAGE_KEY, "{broken-json");
    const fallback = loadKanbanStateFromStorage();
    assert.equal(fallback.columns.length, 4);
    assert.deepEqual(fallback.assignments, {});
  });
});
