import { z } from "zod";

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  nextPageToken?: string | null;
  hasMore: boolean;
  totalLoaded: number;
  isLoadingMore: boolean;
}

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  pageToken: z.string().optional(),
  offset: z.coerce.number().min(0).default(0),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface ReconciliationResult<T> {
  reconciled: T[];
  addedCount: number;
  duplicateCount: number;
}

/**
 * Reconciles and merges newly fetched email threads into the existing thread list.
 * Prevents duplicates by thread ID and preserves thread position and updated content.
 */
export function reconcileEmailThreads<T extends { id?: string }>(
  existingThreads: T[],
  incomingThreads: T[],
): ReconciliationResult<T> {
  if (!existingThreads || existingThreads.length === 0) {
    const uniqueIncoming = filterUniqueThreads(incomingThreads || []);
    return {
      reconciled: uniqueIncoming,
      addedCount: uniqueIncoming.length,
      duplicateCount: (incomingThreads?.length || 0) - uniqueIncoming.length,
    };
  }

  if (!incomingThreads || incomingThreads.length === 0) {
    return {
      reconciled: [...existingThreads],
      addedCount: 0,
      duplicateCount: 0,
    };
  }

  const seenIds = new Set<string>();
  const reconciled: T[] = [];
  let addedCount = 0;
  let duplicateCount = 0;

  // Add existing threads
  for (const thread of existingThreads) {
    if (thread.id) {
      if (!seenIds.has(thread.id)) {
        seenIds.add(thread.id);
        reconciled.push(thread);
      }
    } else {
      reconciled.push(thread);
    }
  }

  // Merge incoming threads
  for (const thread of incomingThreads) {
    if (thread.id) {
      if (seenIds.has(thread.id)) {
        duplicateCount++;
        // Optionally update the existing item in place if newer
        const existingIdx = reconciled.findIndex((t) => t.id === thread.id);
        if (existingIdx !== -1) {
          reconciled[existingIdx] = thread;
        }
      } else {
        seenIds.add(thread.id);
        reconciled.push(thread);
        addedCount++;
      }
    } else {
      reconciled.push(thread);
      addedCount++;
    }
  }

  return {
    reconciled,
    addedCount,
    duplicateCount,
  };
}

/**
 * Filters out duplicate threads from a single list.
 */
export function filterUniqueThreads<T extends { id?: string }>(threads: T[]): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];

  for (const thread of threads) {
    if (thread.id) {
      if (!seen.has(thread.id)) {
        seen.add(thread.id);
        unique.push(thread);
      }
    } else {
      unique.push(thread);
    }
  }

  return unique;
}

/**
 * Generates sample mock threads for pagination testing or fallback loading.
 */
export function generateMockPaginationBatch(
  startIndex: number,
  count: number = 20,
): any[] {
  const batch: any[] = [];
  for (let i = 0; i < count; i++) {
    const idx = startIndex + i + 1;
    batch.push({
      id: `thread-paginated-${idx}`,
      historyId: `hist-${idx}`,
      snippet: `Archived email discussion #${idx} regarding ongoing operational metrics and planning.`,
      messages: [
        {
          id: `msg-${idx}`,
          name: `Partner Team ${idx}`,
          email: `partner${idx}@enterprise.com`,
          subject: `Quarterly Update Follow-up #${idx}`,
          text: `Here is the archived message body for discussion item #${idx}.`,
          date: new Date(Date.now() - idx * 86400000).toISOString(),
          read: true,
          labels: ["INBOX"],
          isHtmlEmail: false,
          to: "jeremy@caley.io",
        },
      ],
    });
  }
  return batch;
}
