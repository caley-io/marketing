import test from "node:test";
import assert from "node:assert/strict";
import {
  extractDateEntities,
  formatFriendlyDate,
  generateAvailabilitySnippet,
} from "../utils/dateNlu.ts";

// Fix reference date for predictable testing: Saturday, 2026-11-07
const REF_DATE = new Date("2026-11-07T12:00:00.000Z");

test("Date NLU: extracts 'today' and 'tonight'", () => {
  const text1 = "Can we sync today to discuss the project?";
  const res1 = extractDateEntities(text1, REF_DATE);
  assert.equal(res1.length, 1);
  assert.equal(res1[0].text, "today");
  assert.equal(res1[0].targetDate, "2026-11-07");

  const text2 = "Are you available tonight?";
  const res2 = extractDateEntities(text2, REF_DATE);
  assert.equal(res2.length, 1);
  assert.equal(res2[0].text, "tonight");
  assert.equal(res2[0].targetDate, "2026-11-07");
});

test("Date NLU: extracts 'tomorrow'", () => {
  const text = "Let's catch up tomorrow morning.";
  const res = extractDateEntities(text, REF_DATE);
  assert.equal(res.length, 1);
  assert.equal(res[0].text, "tomorrow");
  assert.equal(res[0].targetDate, "2026-11-08");
});

test("Date NLU: extracts 'day after tomorrow'", () => {
  const text = "I will be out of office until the day after tomorrow.";
  const res = extractDateEntities(text, REF_DATE);
  assert.equal(res.length, 1);
  assert.match(res[0].text.toLowerCase(), /day after tomorrow/);
  assert.equal(res[0].targetDate, "2026-11-09");
});

test("Date NLU: extracts 'yesterday'", () => {
  const text = "Following up on our email yesterday.";
  const res = extractDateEntities(text, REF_DATE);
  assert.equal(res.length, 1);
  assert.equal(res[0].text, "yesterday");
  assert.equal(res[0].targetDate, "2026-11-06");
});

test("Date NLU: extracts relative 'in 3 days' and 'in a week'", () => {
  const text1 = "Let's review the report in 3 days.";
  const res1 = extractDateEntities(text1, REF_DATE);
  assert.equal(res1.length, 1);
  assert.equal(res1[0].targetDate, "2026-11-10");

  const text2 = "The contract should be signed in a week.";
  const res2 = extractDateEntities(text2, REF_DATE);
  assert.equal(res2.length, 1);
  assert.equal(res2[0].targetDate, "2026-11-14");
});

test("Date NLU: extracts days of week ('this Monday', 'next Friday')", () => {
  // REF_DATE is Saturday 2026-11-07
  // Upcoming Monday is 2026-11-09
  const text1 = "Let's schedule a call on Monday.";
  const res1 = extractDateEntities(text1, REF_DATE);
  assert.equal(res1.length, 1);
  assert.equal(res1[0].targetDate, "2026-11-09");

  // Next Friday is 2026-11-20 (next week's Friday)
  const text2 = "Can we meet next Friday?";
  const res2 = extractDateEntities(text2, REF_DATE);
  assert.equal(res2.length, 1);
  assert.equal(res2[0].targetDate, "2026-11-20");
});

test("Date NLU: extracts explicit month and day patterns ('Nov 15', 'December 25')", () => {
  const text1 = "The workshop is on Nov 15th.";
  const res1 = extractDateEntities(text1, REF_DATE);
  assert.equal(res1.length, 1);
  assert.equal(res1[0].targetDate, "2026-11-15");

  const text2 = "Our holiday party is on December 25, 2026.";
  const res2 = extractDateEntities(text2, REF_DATE);
  assert.equal(res2.length, 1);
  assert.equal(res2[0].targetDate, "2026-12-25");
});

test("Date NLU: extracts multiple dates from realistic email body", () => {
  const body = `Hi Jeremy,
Are you free to meet tomorrow to review the slides?
If not, we could do next Monday or on Nov 18th instead.
Let me know!`;

  const results = extractDateEntities(body, REF_DATE);
  assert.ok(results.length >= 3);
  const targetDates = results.map((r) => r.targetDate);
  assert.ok(targetDates.includes("2026-11-08"), "Should include tomorrow");
  assert.ok(targetDates.includes("2026-11-16"), "Should include next Monday");
  assert.ok(targetDates.includes("2026-11-18"), "Should include Nov 18th");
});

test("Date NLU: generateAvailabilitySnippet formats email proposal correctly", () => {
  const snippet = generateAvailabilitySnippet("2026-11-10", [
    "9:00 AM - 10:30 AM",
    "3:00 PM - 4:30 PM",
  ]);

  assert.ok(snippet.includes("Tue, Nov 10"));
  assert.ok(snippet.includes("9:00 AM - 10:30 AM"));
  assert.ok(snippet.includes("3:00 PM - 4:30 PM"));
});
