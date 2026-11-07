import test from "node:test";
import assert from "node:assert/strict";
import {
  matchesEmailList,
  filterThreadsForList,
  emailListRuleSchema,
  customEmailListSchema,
  createEmailListRequestSchema,
  type CustomEmailList,
} from "../utils/emailLists.ts";

const mockInvestorList: CustomEmailList = {
  id: "list-investors",
  name: "Investors",
  description: "Incoming investor communications and term sheets",
  rules: [
    { type: "sender", value: "sequoia.com" },
    { type: "sender", value: "investor@venture.co" },
    { type: "keyword", value: "term sheet" },
  ],
  manualThreadIds: ["manual-thread-99"],
};

const mockThreads = [
  {
    id: "thread-1",
    messages: [
      {
        email: "partner@sequoia.com",
        name: "Roelof Botha",
        subject: "Follow up on Seed Round Discussion",
        snippet: "Excited about your progress on Inbox Zero.",
        text: "Excited about your progress on Inbox Zero.",
      },
    ],
    snippet: "Excited about your progress on Inbox Zero.",
  },
  {
    id: "thread-2",
    messages: [
      {
        email: "alice@acmecorp.com",
        name: "Alice Smith",
        subject: "Drafting the Term Sheet for Partnership",
        snippet: "Attached is the term sheet for our commercial agreement.",
        text: "Attached is the term sheet for our commercial agreement.",
      },
    ],
    snippet: "Attached is the term sheet for our commercial agreement.",
  },
  {
    id: "thread-3",
    messages: [
      {
        email: "newsletter@substack.com",
        name: "Daily Tech",
        subject: "Morning Digest",
        snippet: "Here is your morning digest of tech news.",
        text: "Here is your morning digest of tech news.",
      },
    ],
    snippet: "Here is your morning digest of tech news.",
  },
  {
    id: "manual-thread-99",
    messages: [
      {
        email: "random@unknown.org",
        name: "Anonymous",
        subject: "Coffee chat",
        snippet: "Can we grab coffee next week?",
        text: "Can we grab coffee next week?",
      },
    ],
    snippet: "Can we grab coffee next week?",
  },
];

test("emailList schemas validate properly", () => {
  assert.equal(
    emailListRuleSchema.safeParse({ type: "sender", value: "test@domain.com" }).success,
    true,
  );
  assert.equal(
    emailListRuleSchema.safeParse({ type: "domain", value: "domain.com" }).success,
    true,
  );
  assert.equal(
    emailListRuleSchema.safeParse({ type: "invalid", value: "domain.com" }).success,
    false,
  );

  const createReq = createEmailListRequestSchema.safeParse({
    name: "VIP Investors",
    rules: [{ type: "keyword", value: "valuation" }],
  });
  assert.equal(createReq.success, true);
});

test("matchesEmailList matches emails based on sender rule", () => {
  const match = matchesEmailList(mockThreads[0], mockInvestorList);
  assert.equal(match, true);
});

test("matchesEmailList matches emails based on keyword rule", () => {
  const match = matchesEmailList(mockThreads[1], mockInvestorList);
  assert.equal(match, true);
});

test("matchesEmailList does not match unrelated threads", () => {
  const match = matchesEmailList(mockThreads[2], mockInvestorList);
  assert.equal(match, false);
});

test("matchesEmailList respects manualThreadIds assignments", () => {
  const match = matchesEmailList(mockThreads[3], mockInvestorList);
  assert.equal(match, true);
});

test("filterThreadsForList returns only matching threads", () => {
  const filtered = filterThreadsForList(mockThreads, mockInvestorList);
  assert.equal(filtered.length, 3);
  const ids = filtered.map((t) => t.id);
  assert.ok(ids.includes("thread-1"));
  assert.ok(ids.includes("thread-2"));
  assert.ok(ids.includes("manual-thread-99"));
  assert.ok(!ids.includes("thread-3"));
});

test("matchesEmailList handles domain-based rules", () => {
  const domainList: CustomEmailList = {
    id: "list-domain",
    name: "Enterprise",
    rules: [{ type: "domain", value: "acmecorp.com" }],
    manualThreadIds: [],
  };

  assert.equal(matchesEmailList(mockThreads[1], domainList), true);
  assert.equal(matchesEmailList(mockThreads[0], domainList), false);
});
