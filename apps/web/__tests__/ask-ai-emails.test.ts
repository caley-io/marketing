import test from "node:test";
import assert from "node:assert/strict";
import {
  askAiEmailQuerySchema,
  rankEmailsForQuestion,
  buildAskAiSystemPrompt,
  buildAskAiUserPrompt,
  generateAskAiFallback,
  type EmailContextItem,
} from "../utils/askAiEmails.ts";

const mockEmails: EmailContextItem[] = [
  {
    id: "thread-1",
    sender: "John Doe",
    email: "john@example.com",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    subject: "Q4 Marketing Strategy and Partnership Agreement",
    snippet: "We agreed on a $25,000 budget for Q4 marketing and signed the client service agreement.",
    text: "Hi team,\n\nWe agreed on a $25,000 budget for Q4 marketing and signed the client service agreement with Acme Corp.\n\nBest,\nJohn",
  },
  {
    id: "thread-2",
    sender: "Sarah Connor",
    email: "sarah@cyberdyne.org",
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    subject: "Server Migration Schedule",
    snippet: "Maintenance is scheduled for Saturday night at 11 PM UTC. Downtime expected ~15 mins.",
    text: "Maintenance is scheduled for Saturday night at 11 PM UTC. Downtime expected ~15 mins.",
  },
  {
    id: "thread-3",
    sender: "Client X Corp",
    email: "legal@clientx.io",
    date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    subject: "Final Agreement Terms Signed",
    snippet: "The SLA agreement terms have been agreed upon: 99.9% uptime SLA with Net-30 payment terms.",
    text: "The SLA agreement terms have been agreed upon: 99.9% uptime SLA with Net-30 payment terms.",
  },
];

test("askAiEmailQuerySchema validates valid and invalid requests", () => {
  const valid = askAiEmailQuerySchema.safeParse({
    question: "What did John talk about in the last email he sent me?",
    limit: 5,
  });
  assert.equal(valid.success, true);

  const empty = askAiEmailQuerySchema.safeParse({
    question: "",
  });
  assert.equal(empty.success, false);
});

test("rankEmailsForQuestion ranks sender-matched and topic-matched emails highest", () => {
  // Query 1: John
  const rankedJohn = rankEmailsForQuestion(
    mockEmails,
    "What did John talk about in the last email he sent me?",
  );
  assert.equal(rankedJohn.length, 3);
  assert.equal(rankedJohn[0].email.id, "thread-1");
  assert.ok(rankedJohn[0].score > rankedJohn[1].score);

  // Query 2: Client X agreement
  const rankedClient = rankEmailsForQuestion(
    mockEmails,
    "What was the agreement we had with client X?",
  );
  assert.equal(rankedClient[0].email.id, "thread-3");
  assert.ok(rankedClient[0].score > 0);
});

test("buildAskAiSystemPrompt returns explicit instructions with citation rules", () => {
  const sys = buildAskAiSystemPrompt();
  assert.match(sys, /AI Email Assistant for Inbox Zero/);
  assert.match(sys, /cite relevant emails/i);
});

test("buildAskAiUserPrompt includes email contexts and user query", () => {
  const prompt = buildAskAiUserPrompt(
    "What is the server migration schedule?",
    [mockEmails[1]],
  );
  assert.match(prompt, /Sarah Connor/);
  assert.match(prompt, /Server Migration Schedule/);
  assert.match(prompt, /What is the server migration schedule\?/);
});

test("generateAskAiFallback generates accurate answer for John query", () => {
  const res = generateAskAiFallback(
    "What did John talk about in the last email he sent me?",
    mockEmails,
  );
  assert.equal(res.mode, "fallback");
  assert.match(res.answer, /John/i);
  assert.match(res.answer, /Q4 Marketing Strategy/i);
  assert.ok(res.sources.length > 0);
  assert.equal(res.sources[0].id, "thread-1");
});

test("generateAskAiFallback generates accurate answer for Client X agreement query", () => {
  const res = generateAskAiFallback(
    "What was the agreement we had with client X?",
    mockEmails,
  );
  assert.equal(res.mode, "fallback");
  assert.match(res.answer, /Client X/i);
  assert.match(res.answer, /SLA agreement terms/i);
  assert.ok(res.sources.length > 0);
});

test("generateAskAiFallback handles empty inboxes gracefully", () => {
  const res = generateAskAiFallback("Any unread emails?", []);
  assert.equal(res.mode, "fallback");
  assert.match(res.answer, /No emails are currently available/i);
  assert.equal(res.sources.length, 0);
});
