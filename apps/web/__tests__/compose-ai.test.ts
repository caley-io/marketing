import test from "node:test";
import assert from "node:assert/strict";
import {
  aiComposeActionSchema,
  aiComposeToneSchema,
  aiComposeRequestSchema,
  buildSystemPrompt,
  buildUserPrompt,
  generateLocalFallback,
} from "../utils/aiCompose.ts";

test("aiCompose schemas validate properly", () => {
  assert.equal(aiComposeActionSchema.safeParse("continue").success, true);
  assert.equal(aiComposeActionSchema.safeParse("shorten").success, true);
  assert.equal(aiComposeActionSchema.safeParse("polish").success, true);
  assert.equal(aiComposeActionSchema.safeParse("change-tone").success, true);
  assert.equal(aiComposeActionSchema.safeParse("invalid-action").success, false);

  assert.equal(aiComposeToneSchema.safeParse("professional").success, true);
  assert.equal(aiComposeToneSchema.safeParse("casual").success, true);
  assert.equal(aiComposeToneSchema.safeParse("friendly").success, true);
  assert.equal(aiComposeToneSchema.safeParse("persuasive").success, true);
  assert.equal(aiComposeToneSchema.safeParse("rude").success, false);

  const validReq = aiComposeRequestSchema.safeParse({
    text: "Can you send the contract?",
    action: "polish",
  });
  assert.equal(validReq.success, true);

  const emptyReq = aiComposeRequestSchema.safeParse({
    text: "",
    action: "polish",
  });
  assert.equal(emptyReq.success, false);
});

test("buildSystemPrompt produces distinct instructions per action", () => {
  const continuePrompt = buildSystemPrompt("continue");
  assert.match(continuePrompt, /Continue writing/i);

  const shortenPrompt = buildSystemPrompt("shorten");
  assert.match(shortenPrompt, /Condense and shorten/i);

  const polishPrompt = buildSystemPrompt("polish");
  assert.match(polishPrompt, /Polish and rewrite/i);

  const tonePrompt = buildSystemPrompt("change-tone", "persuasive");
  assert.match(tonePrompt, /Adjust the tone/i);
  assert.match(tonePrompt, /persuasive/i);
});

test("buildUserPrompt accurately includes email text, action, tone, and guidance", () => {
  const prompt = buildUserPrompt({
    text: "Here is the proposal for your review.",
    action: "change-tone",
    tone: "casual",
    customInstructions: "Keep it under 30 words",
  });

  assert.match(prompt, /Here is the proposal for your review/);
  assert.match(prompt, /Rewrite this email in a casual tone/);
  assert.match(prompt, /Additional guidance: Keep it under 30 words/);
});

test("generateLocalFallback handles 'continue' by extending draft text", () => {
  const input = "Hi John, regarding the project roadmap, we completed phase 1.";
  const result = generateLocalFallback({
    text: input,
    action: "continue",
  });

  assert.ok(result.startsWith(input));
  assert.ok(result.length > input.length);
  assert.match(result, /let me know your thoughts/i);
});

test("generateLocalFallback handles 'shorten' by removing filler", () => {
  const input = "I just wanted to reach out and let you know that we need this report as soon as possible in order to proceed.";
  const result = generateLocalFallback({
    text: input,
    action: "shorten",
  });

  assert.ok(result.length < input.length);
  assert.doesNotMatch(result, /I just wanted to reach out and let you know that/);
  assert.doesNotMatch(result, /in order to/);
});

test("generateLocalFallback handles 'polish' with capitalization and punctuation", () => {
  const input = "hello team. we need to meet tomorrow? please confirm";
  const result = generateLocalFallback({
    text: input,
    action: "polish",
  });

  assert.ok(result.startsWith("Hello"));
  assert.ok(result.endsWith("."));
});

test("generateLocalFallback handles tone transformations", () => {
  // Casual
  const casualResult = generateLocalFallback({
    text: "Dear Sir/Madam, I would like to inquire about the pricing. Sincerely,",
    action: "change-tone",
    tone: "casual",
  });
  assert.match(casualResult, /Hey there,/);
  assert.match(casualResult, /Quick question about/);
  assert.match(casualResult, /Cheers,/);

  // Friendly
  const friendlyResult = generateLocalFallback({
    text: "Please send the file.",
    action: "change-tone",
    tone: "friendly",
  });
  assert.match(friendlyResult, /Hope you're having a wonderful day!/);
  assert.match(friendlyResult, /Have a great rest of your week!/);

  // Persuasive
  const persuasiveResult = generateLocalFallback({
    text: "We should implement this new solution.",
    action: "change-tone",
    tone: "persuasive",
  });
  assert.match(persuasiveResult, /Partnering together will allow us to achieve measurable impact/);
  assert.match(persuasiveResult, /Let's make this happen!/);

  // Professional
  const professionalResult = generateLocalFallback({
    text: "hey there, thanks a bunch for the help, cheers!",
    action: "change-tone",
    tone: "professional",
  });
  assert.match(professionalResult, /Hello/);
  assert.match(professionalResult, /Thank you very much/);
  assert.match(professionalResult, /Best regards/);
});
