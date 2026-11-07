import { z } from "zod";

export interface AccountMetadata {
  label: string;
  email: string;
  icon?: string;
}

export interface SearchableMessage {
  id: string;
  name: string;
  email: string;
  to?: string;
  subject: string;
  snippet: string;
  text?: string;
  date: string;
  read: boolean;
  labels: string[];
  accountEmail?: string;
  accountLabel?: string;
}

export interface SearchableThread {
  id: string;
  accountEmail: string;
  accountLabel: string;
  messages: SearchableMessage[];
  snippet: string;
}

export interface ParsedSearchQuery {
  rawQuery: string;
  textTerms: string[];
  fromFilters: string[];
  toFilters: string[];
  subjectFilters: string[];
  accountFilters: string[];
  hasAttachment?: boolean;
  isUnread?: boolean;
}

export const multiAccountSearchSchema = z.object({
  query: z.string().default(""),
  accountEmail: z.string().optional(), // If omitted or "all", searches all accounts
  accounts: z
    .array(
      z.object({
        label: z.string(),
        email: z.string(),
      }),
    )
    .optional(),
  limit: z.number().optional().default(50),
});

export type MultiAccountSearchRequest = z.infer<typeof multiAccountSearchSchema>;

/**
 * Parses query strings supporting operators:
 * - `from:user@domain.com` or `from:name`
 * - `to:user@domain.com`
 * - `subject:keyword`
 * - `account:work@domain.com` or `account:personal`
 * - `is:unread`
 * - `has:attachment`
 * - plain text terms
 */
export function parseSearchQuery(query: string): ParsedSearchQuery {
  const result: ParsedSearchQuery = {
    rawQuery: query,
    textTerms: [],
    fromFilters: [],
    toFilters: [],
    subjectFilters: [],
    accountFilters: [],
  };

  if (!query || !query.trim()) {
    return result;
  }

  // Tokenize preserving quoted strings or operator:value
  const tokens = query.match(/(?:[^\s"]+|"[^"]*")+/g) || [];

  for (const token of tokens) {
    const cleanToken = token.replace(/^"(.*)"$/, "$1");

    if (cleanToken.toLowerCase().startsWith("from:")) {
      const val = cleanToken.slice(5).trim();
      if (val) result.fromFilters.push(val.toLowerCase());
    } else if (cleanToken.toLowerCase().startsWith("to:")) {
      const val = cleanToken.slice(3).trim();
      if (val) result.toFilters.push(val.toLowerCase());
    } else if (cleanToken.toLowerCase().startsWith("subject:")) {
      const val = cleanToken.slice(8).trim();
      if (val) result.subjectFilters.push(val.toLowerCase());
    } else if (cleanToken.toLowerCase().startsWith("account:")) {
      const val = cleanToken.slice(8).trim();
      if (val) result.accountFilters.push(val.toLowerCase());
    } else if (cleanToken.toLowerCase() === "is:unread") {
      result.isUnread = true;
    } else if (cleanToken.toLowerCase() === "has:attachment") {
      result.hasAttachment = true;
    } else {
      result.textTerms.push(cleanToken.toLowerCase());
    }
  }

  return result;
}

/**
 * Evaluates whether a searchable thread matches the parsed query.
 */
export function matchThreadQuery(
  thread: SearchableThread,
  parsed: ParsedSearchQuery,
): { matches: boolean; score: number } {
  // If query is blank, everything matches
  if (
    parsed.textTerms.length === 0 &&
    parsed.fromFilters.length === 0 &&
    parsed.toFilters.length === 0 &&
    parsed.subjectFilters.length === 0 &&
    parsed.accountFilters.length === 0 &&
    parsed.isUnread === undefined &&
    parsed.hasAttachment === undefined
  ) {
    return { matches: true, score: 1 };
  }

  const firstMsg = thread.messages?.[0];
  const lastMsg = thread.messages?.[thread.messages.length - 1];

  // 1. Account Filter
  if (parsed.accountFilters.length > 0) {
    const accMatch = parsed.accountFilters.some(
      (filter) =>
        thread.accountEmail.toLowerCase().includes(filter) ||
        thread.accountLabel.toLowerCase().includes(filter),
    );
    if (!accMatch) return { matches: false, score: 0 };
  }

  // 2. is:unread Filter
  if (parsed.isUnread) {
    const hasUnread = thread.messages.some((m) => !m.read);
    if (!hasUnread) return { matches: false, score: 0 };
  }

  // 3. From Filter
  if (parsed.fromFilters.length > 0) {
    const senderMatch = parsed.fromFilters.every((filter) =>
      thread.messages.some(
        (m) =>
          m.name.toLowerCase().includes(filter) ||
          m.email.toLowerCase().includes(filter),
      ),
    );
    if (!senderMatch) return { matches: false, score: 0 };
  }

  // 4. To Filter
  if (parsed.toFilters.length > 0) {
    const toMatch = parsed.toFilters.every((filter) =>
      thread.messages.some((m) => (m.to || "").toLowerCase().includes(filter)),
    );
    if (!toMatch) return { matches: false, score: 0 };
  }

  // 5. Subject Filter
  if (parsed.subjectFilters.length > 0) {
    const subjectMatch = parsed.subjectFilters.every((filter) =>
      thread.messages.some((m) => m.subject.toLowerCase().includes(filter)),
    );
    if (!subjectMatch) return { matches: false, score: 0 };
  }

  // 6. Text Terms Full Search
  let score = 10;
  if (parsed.textTerms.length > 0) {
    for (const term of parsed.textTerms) {
      let termMatched = false;
      for (const m of thread.messages) {
        if (m.subject.toLowerCase().includes(term)) {
          score += 15;
          termMatched = true;
        }
        if (m.name.toLowerCase().includes(term) || m.email.toLowerCase().includes(term)) {
          score += 10;
          termMatched = true;
        }
        if (m.snippet.toLowerCase().includes(term) || (m.text && m.text.toLowerCase().includes(term))) {
          score += 5;
          termMatched = true;
        }
      }
      if (!termMatched) {
        return { matches: false, score: 0 };
      }
    }
  }

  return { matches: true, score };
}

/**
 * Searches across all provided accounts simultaneously.
 */
export function searchMultiAccountThreads(
  threadsByAccount: Record<string, { account: AccountMetadata; threads: SearchableThread[] }>,
  query: string,
  targetAccountEmail?: string,
): {
  results: SearchableThread[];
  totalMatches: number;
  matchesByAccount: Record<string, number>;
} {
  const parsed = parseSearchQuery(query);
  const results: { thread: SearchableThread; score: number }[] = [];
  const matchesByAccount: Record<string, number> = {};

  const accountKeys = Object.keys(threadsByAccount);

  for (const accKey of accountKeys) {
    // If targetAccountEmail is specified and not "all", filter only that account
    if (
      targetAccountEmail &&
      targetAccountEmail !== "all" &&
      accKey.toLowerCase() !== targetAccountEmail.toLowerCase()
    ) {
      continue;
    }

    const entry = threadsByAccount[accKey];
    matchesByAccount[accKey] = 0;

    for (const thread of entry.threads) {
      const matchResult = matchThreadQuery(thread, parsed);
      if (matchResult.matches) {
        matchesByAccount[accKey]++;
        results.push({
          thread: {
            ...thread,
            accountEmail: entry.account.email,
            accountLabel: entry.account.label,
          },
          score: matchResult.score,
        });
      }
    }
  }

  // Sort by highest score first
  results.sort((a, b) => b.score - a.score);

  return {
    results: results.map((r) => r.thread),
    totalMatches: results.length,
    matchesByAccount,
  };
}
