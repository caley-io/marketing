import test from "node:test";
import assert from "node:assert/strict";
import {
  prepareEmailHtml,
  extractPlainTextFromHtml,
  isComplexHtmlEmail,
} from "../utils/htmlSanitizer.ts";

test("HTML Email: sanitizes dangerous tags (script, object, embed)", () => {
  const dangerousHtml = `
    <div>
      <h1>Welcome to our service</h1>
      <script>alert('xss attack');</script>
      <object data="malicious.swf"></object>
      <embed src="flash.swf" />
      <p>Safe content</p>
    </div>
  `;

  const prepared = prepareEmailHtml(dangerousHtml);
  assert.ok(!prepared.includes("alert('xss attack')"));
  assert.ok(!prepared.includes("<object"));
  assert.ok(!prepared.includes("<embed"));
  assert.ok(prepared.includes("Safe content"));
});

test("HTML Email: forces all links to open in a new tab safely", () => {
  const htmlWithLinks = `
    <p>Please visit our <a href="https://caley.io">website</a> or <a href="https://docs.caley.io" target="_self">docs</a>.</p>
  `;

  const prepared = prepareEmailHtml(htmlWithLinks);
  assert.ok(prepared.includes('target="_blank"'));
  assert.ok(prepared.includes('rel="noopener noreferrer"'));
  // Ensure target="_self" was overridden
  assert.ok(!prepared.includes('target="_self"'));
});

test("HTML Email: injects responsive styles and auto-resize observer script", () => {
  const simpleHtml = `<div>Hello world</div>`;
  const prepared = prepareEmailHtml(simpleHtml, { isDarkMode: true });

  assert.ok(prepared.includes("CALEY_EMAIL_RESIZE"));
  assert.ok(prepared.includes("ResizeObserver"));
  assert.ok(prepared.includes("color-scheme: dark"));
  assert.ok(prepared.includes("img {"));
  assert.ok(prepared.includes("max-width: 100% !important;"));
});

test("HTML Email: extractPlainTextFromHtml converts HTML to clean readable text", () => {
  const richHtml = `
    <div>
      <p>Dear Jeremy,</p>
      <p>Thank you for reaching out &amp; discussing the proposal.<br />We would love to move forward.</p>
      <ul>
        <li>Timeline: 2 weeks</li>
        <li>Budget: $10,000</li>
      </ul>
      <p>Best regards,<br>The Team</p>
    </div>
  `;

  const text = extractPlainTextFromHtml(richHtml);
  assert.ok(text.includes("Dear Jeremy,"));
  assert.ok(text.includes("reaching out & discussing"));
  assert.ok(text.includes("Timeline: 2 weeks"));
  assert.ok(text.includes("Budget: $10,000"));
  assert.ok(text.includes("Best regards"));
  assert.ok(!text.includes("<p>"));
  assert.ok(!text.includes("<br"));
});

test("HTML Email: isComplexHtmlEmail accurately distinguishes newsletters from chat", () => {
  const newsletter = `
    <!DOCTYPE html>
    <html>
      <head><title>Weekly Digest</title></head>
      <body>
        <table width="100%">
          <tr><td>Article 1</td></tr>
        </table>
        <table width="100%">
          <tr><td>Article 2</td></tr>
        </table>
        <p>Click here to unsubscribe</p>
      </body>
    </html>
  `;

  const conversational = `
    <div>
      <p>Hey Jeremy, are you free tomorrow at 2pm?</p>
    </div>
  `;

  assert.equal(isComplexHtmlEmail(newsletter), true);
  assert.equal(isComplexHtmlEmail(conversational), false);
});
