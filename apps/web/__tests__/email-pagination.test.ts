import test from "node:test";
import assert from "node:assert/strict";
import {
  reconcileEmailThreads,
  filterUniqueThreads,
  generateMockPaginationBatch,
  paginationQuerySchema,
} from "../utils/emailPagination.ts";

test("Email Pagination: validates query schema", () => {
  const query = paginationQuerySchema.parse({
    limit: "50",
    offset: "100",
    pageToken: "token-abc-123",
  });

  assert.equal(query.limit, 50);
  assert.equal(query.offset, 100);
  assert.equal(query.pageToken, "token-abc-123");

  // Defaults
  const empty = paginationQuerySchema.parse({});
  assert.equal(empty.limit, 50);
  assert.equal(empty.offset, 0);

  // Invalid: limit > 100
  assert.throws(() => paginationQuerySchema.parse({ limit: 150 }));
});

test("Email Pagination: filterUniqueThreads removes duplicate IDs", () => {
  const threads = [
    { id: "t-1", subject: "Thread 1" },
    { id: "t-2", subject: "Thread 2" },
    { id: "t-1", subject: "Thread 1 Duplicate" },
    { id: "t-3", subject: "Thread 3" },
  ];

  const unique = filterUniqueThreads(threads);
  assert.equal(unique.length, 3);
  assert.deepEqual(
    unique.map((t) => t.id),
    ["t-1", "t-2", "t-3"],
  );
  assert.equal(unique[0].subject, "Thread 1");
});

test("Email Pagination: reconcileEmailThreads handles empty arrays", () => {
  const existing = [{ id: "t-1", subject: "Existing" }];

  // Empty incoming
  const res1 = reconcileEmailThreads(existing, []);
  assert.equal(res1.reconciled.length, 1);
  assert.equal(res1.addedCount, 0);
  assert.equal(res1.duplicateCount, 0);

  // Empty existing
  const res2 = reconcileEmailThreads([], existing);
  assert.equal(res2.reconciled.length, 1);
  assert.equal(res2.addedCount, 1);
  assert.equal(res2.duplicateCount, 0);
});

test("Email Pagination: reconcileEmailThreads merges new items without duplicates", () => {
  const existing = [
    { id: "t-1", subject: "Thread 1" },
    { id: "t-2", subject: "Thread 2" },
  ];

  const incoming = [
    { id: "t-2", subject: "Thread 2 Updated" },
    { id: "t-3", subject: "Thread 3" },
    { id: "t-4", subject: "Thread 4" },
  ];

  const result = reconcileEmailThreads(existing, incoming);
  assert.equal(result.reconciled.length, 4);
  assert.equal(result.addedCount, 2);
  assert.equal(result.duplicateCount, 1);

  // Preserves existing thread 1, updates duplicate thread 2 in place, appends 3 and 4
  assert.deepEqual(
    result.reconciled.map((t) => t.id),
    ["t-1", "t-2", "t-3", "t-4"],
  );
  assert.equal(result.reconciled[1].subject, "Thread 2 Updated");
});

test("Email Pagination: generateMockPaginationBatch creates expected batch", () => {
  const batch = generateMockPaginationBatch(50, 20);
  assert.equal(batch.length, 20);
  assert.equal(batch[0].id, "thread-paginated-51");
  assert.equal(batch[19].id, "thread-paginated-70");
  assert.ok(batch[0].messages.length > 0);
});
