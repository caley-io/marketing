import { z } from "zod";

export interface EmailListRule {
  type: "sender" | "subject" | "domain" | "keyword";
  value: string;
}

export interface CustomEmailList {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  rules: EmailListRule[];
  manualThreadIds: string[]; // Thread IDs manually assigned/moved to this list
}

export const emailListRuleSchema = z.object({
  type: z.enum(["sender", "subject", "domain", "keyword"]),
  value: z.string().min(1, "Rule value cannot be empty"),
});

export const customEmailListSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "List name is required"),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  rules: z.array(emailListRuleSchema).default([]),
  manualThreadIds: z.array(z.string()).default([]),
});

export const createEmailListRequestSchema = z.object({
  name: z.string().min(1, "List name is required"),
  description: z.string().optional(),
  rules: z.array(emailListRuleSchema).default([]),
});

export type CreateEmailListRequest = z.infer<typeof createEmailListRequestSchema>;

/**
 * Checks whether an email thread matches the list criteria:
 * 1. Has the thread ID been explicitly moved to this list?
 * 2. Does any message in the thread satisfy any of the configured list rules?
 */
export function matchesEmailList(
  thread: {
    id: string;
    messages?: Array<{
      email?: string;
      name?: string;
      subject?: string;
      snippet?: string;
      text?: string;
    }>;
    snippet?: string;
  },
  list: CustomEmailList,
): boolean {
  // Check explicit assignment
  if (list.manualThreadIds && list.manualThreadIds.includes(thread.id)) {
    return true;
  }

  // If no rules, only manual assignments count
  if (!list.rules || list.rules.length === 0) {
    return false;
  }

  const messages = thread.messages || [];

  return list.rules.some((rule) => {
    const val = rule.value.toLowerCase().trim();
    if (!val) return false;

    switch (rule.type) {
      case "sender": {
        // Matches if any message's sender email or name includes the rule value
        return messages.some((m) => {
          const email = (m.email || "").toLowerCase();
          const name = (m.name || "").toLowerCase();
          return email.includes(val) || name.includes(val);
        });
      }
      case "domain": {
        // Matches if sender domain matches rule value (e.g. '@acme.com' or 'acme.com')
        const cleanDomain = val.startsWith("@") ? val.slice(1) : val;
        return messages.some((m) => {
          const email = (m.email || "").toLowerCase();
          const domain = email.split("@")[1] || "";
          return domain.includes(cleanDomain);
        });
      }
      case "subject": {
        return messages.some((m) => {
          const subject = (m.subject || "").toLowerCase();
          return subject.includes(val);
        });
      }
      case "keyword": {
        return messages.some((m) => {
          const subject = (m.subject || "").toLowerCase();
          const snippet = (m.snippet || thread.snippet || "").toLowerCase();
          const text = (m.text || "").toLowerCase();
          return (
            subject.includes(val) || snippet.includes(val) || text.includes(val)
          );
        });
      }
      default:
        return false;
    }
  });
}

/**
 * Filter an array of threads against a custom list.
 */
export function filterThreadsForList<T extends { id: string; messages?: any[]; snippet?: string }>(
  threads: T[],
  list: CustomEmailList,
): T[] {
  return threads.filter((t) => matchesEmailList(t, list));
}

/**
 * Default sample lists (e.g. Investor, Clients)
 */
export const defaultCustomLists: CustomEmailList[] = [
  {
    id: "list-investor",
    name: "Investor",
    description: "Updates and inquiries from current and prospective investors",
    color: "emerald",
    rules: [
      { type: "sender", value: "investor@fund.com" },
      { type: "keyword", value: "seed round" },
      { type: "keyword", value: "term sheet" },
    ],
    manualThreadIds: [],
  },
  {
    id: "list-clients",
    name: "VIP Clients",
    description: "Key account clients and high priority contracts",
    color: "blue",
    rules: [
      { type: "domain", value: "enterprise.com" },
      { type: "subject", value: "SLA" },
    ],
    manualThreadIds: [],
  },
];
