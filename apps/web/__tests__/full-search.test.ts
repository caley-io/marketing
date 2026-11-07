import test from "node:test";
import assert from "node:assert/strict";
import {
  parseSearchQuery,
  matchThreadQuery,
  searchMultiAccountThreads,
  multiAccountSearchSchema,
  type SearchableThread,
} from "../utils/fullSearch.ts";

const mockMultiAccountThreads: Record<string, { account: { label: string; email: string }; threads: SearchableThread[] }> = {
  "work@company.com": {
    account: { label: "Work Account", email: "work@company.com" },
    threads: [
      {
        id: "t-1",
        accountEmail: "work@company.com",
        accountLabel: "Work Account",
        messages: [
          {
            id: "m-1",
            name: "Alice Engineer",
            email: "alice@company.com",
            to: "work@company.com",
            subject: "Deployment Status: Production v2.0 Ready",
            snippet: "The pipeline deployment succeeded on AWS us-east-1.",
            text: "Hi team, the pipeline deployment succeeded on AWS us-east-1.",
            date: "2026-11-06T10:00:00Z",
            read: true,
            labels: ["work", "important"],
          },
        ],
        snippet: "The pipeline deployment succeeded on AWS us-east-1.",
      },
      {
        id: "t-2",
        accountEmail: "work@company.com",
        accountLabel: "Work Account",
        messages: [
          {
            id: "m-2",
            name: "Finance Department",
            email: "finance@company.com",
            to: "work@company.com",
            subject: "October Expense Reimbursement Approved",
            snippet: "Your travel expense report for $1,420 has been approved.",
            text: "Your travel expense report for $1,420 has been approved.",
            date: "2026-11-05T14:30:00Z",
            read: false,
            labels: ["finance", "receipt"],
          },
        ],
        snippet: "Your travel expense report for $1,420 has been approved.",
      },
    ],
  },
  "personal@gmail.com": {
    account: { label: "Personal Gmail", email: "personal@gmail.com" },
    threads: [
      {
        id: "t-3",
        accountEmail: "personal@gmail.com",
        accountLabel: "Personal Gmail",
        messages: [
          {
            id: "m-3",
            name: "Bob Friend",
            email: "bob@gmail.com",
            to: "personal@gmail.com",
            subject: "Weekend Camping Trip",
            snippet: "Are we still heading to Yosemite national park this weekend?",
            text: "Are we still heading to Yosemite national park this weekend?",
            date: "2026-11-04T18:00:00Z",
            read: true,
            labels: ["personal"],
          },
        ],
        snippet: "Are we still heading to Yosemite national park this weekend?",
      },
      {
        id: "t-4",
        accountEmail: "personal@gmail.com",
        accountLabel: "Personal Gmail",
        messages: [
          {
            id: "m-4",
            name: "Alice Freelance Client",
            email: "alice@startup.io",
            to: "personal@gmail.com",
            subject: "Consulting Agreement and Invoice",
            snippet: "Attached is the consulting agreement for project review.",
            text: "Attached is the consulting agreement for project review.",
            date: "2026-11-03T09:15:00Z",
            read: false,
            labels: ["consulting", "important"],
          },
        ],
        snippet: "Attached is the consulting agreement for project review.",
      },
    ],
  },
};

test("multiAccountSearchSchema validates parameters properly", () => {
  const valid = multiAccountSearchSchema.safeParse({
    query: "from:alice",
    accountEmail: "all",
  });
  assert.equal(valid.success, true);
});

test("parseSearchQuery extracts operators and free text", () => {
  const parsed = parseSearchQuery("from:alice subject:deployment is:unread AWS us-east-1");
  assert.deepEqual(parsed.fromFilters, ["alice"]);
  assert.deepEqual(parsed.subjectFilters, ["deployment"]);
  assert.equal(parsed.isUnread, true);
  assert.deepEqual(parsed.textTerms, ["aws", "us-east-1"]);
});

test("searchMultiAccountThreads searches across ALL connected email accounts simultaneously", () => {
  // Query for 'Alice' - exists in both work@company.com and personal@gmail.com
  const { results, totalMatches, matchesByAccount } = searchMultiAccountThreads(
    mockMultiAccountThreads,
    "alice",
  );

  assert.equal(totalMatches, 2);
  assert.equal(matchesByAccount["work@company.com"], 1);
  assert.equal(matchesByAccount["personal@gmail.com"], 1);

  const matchedAccounts = results.map((r) => r.accountEmail);
  assert.ok(matchedAccounts.includes("work@company.com"));
  assert.ok(matchedAccounts.includes("personal@gmail.com"));
});

test("searchMultiAccountThreads supports filtering to a single account", () => {
  const { results, totalMatches, matchesByAccount } = searchMultiAccountThreads(
    mockMultiAccountThreads,
    "alice",
    "personal@gmail.com",
  );

  assert.equal(totalMatches, 1);
  assert.equal(results[0].id, "t-4");
  assert.equal(results[0].accountEmail, "personal@gmail.com");
  assert.equal(matchesByAccount["work@company.com"], undefined);
});

test("matchThreadQuery handles is:unread filter", () => {
  const parsed = parseSearchQuery("is:unread");
  const threadRead = mockMultiAccountThreads["work@company.com"].threads[0];
  const threadUnread = mockMultiAccountThreads["work@company.com"].threads[1];

  assert.equal(matchThreadQuery(threadRead, parsed).matches, false);
  assert.equal(matchThreadQuery(threadUnread, parsed).matches, true);
});

test("matchThreadQuery handles account: operator", () => {
  const parsed = parseSearchQuery("account:personal");
  const threadWork = mockMultiAccountThreads["work@company.com"].threads[0];
  const threadPersonal = mockMultiAccountThreads["personal@gmail.com"].threads[0];

  assert.equal(matchThreadQuery(threadWork, parsed).matches, false);
  assert.equal(matchThreadQuery(threadPersonal, parsed).matches, true);
});
