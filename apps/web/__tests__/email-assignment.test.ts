import test from "node:test";
import assert from "node:assert/strict";
import {
  teamMemberSchema,
  emailAssignmentSchema,
  assignEmailToMember,
  unassignEmail,
  filterThreadsByAssignee,
  defaultTeamMembers,
  type TeamMember,
  type EmailAssignment,
} from "../utils/emailAssignment.ts";

test("Email Assignment: validates team member schema", () => {
  const member: TeamMember = {
    id: "m-1",
    name: "Jeremy Scatigna",
    email: "jeremy@caley.io",
    role: "admin",
  };

  const parsed = teamMemberSchema.parse(member);
  assert.equal(parsed.name, "Jeremy Scatigna");
  assert.equal(parsed.role, "admin");

  // Invalid email
  assert.throws(() =>
    teamMemberSchema.parse({
      id: "m-invalid",
      name: "Bad Email",
      email: "not-an-email",
    }),
  );
});

test("Email Assignment: defaultTeamMembers provides initial team", () => {
  assert.ok(defaultTeamMembers.length >= 3);
  const emails = defaultTeamMembers.map((m) => m.email);
  assert.ok(emails.includes("jeremy@caley.io"));
  assert.ok(emails.includes("alex@caley.io"));
  assert.ok(emails.includes("sarah@caley.io"));
});

test("Email Assignment: assignEmailToMember assigns thread and records metadata", () => {
  const initial: Record<string, EmailAssignment> = {};
  const assignee = defaultTeamMembers[1]; // Alex Smith

  const updated = assignEmailToMember(
    initial,
    "thread-123",
    assignee,
    "Jeremy Scatigna",
    "Please follow up on contract terms",
  );

  assert.ok(updated["thread-123"]);
  assert.equal(updated["thread-123"].threadId, "thread-123");
  assert.equal(updated["thread-123"].assignee.email, "alex@caley.io");
  assert.equal(updated["thread-123"].assignedBy, "Jeremy Scatigna");
  assert.equal(
    updated["thread-123"].notes,
    "Please follow up on contract terms",
  );
  assert.ok(updated["thread-123"].assignedAt);

  // Validate against zod schema
  const parsed = emailAssignmentSchema.parse(updated["thread-123"]);
  assert.equal(parsed.threadId, "thread-123");
});

test("Email Assignment: reassigning updates assignment to new member", () => {
  let assignments: Record<string, EmailAssignment> = {};
  assignments = assignEmailToMember(
    assignments,
    "thread-100",
    defaultTeamMembers[0],
  );
  assert.equal(assignments["thread-100"].assignee.email, "jeremy@caley.io");

  // Reassign to Sarah
  assignments = assignEmailToMember(
    assignments,
    "thread-100",
    defaultTeamMembers[2],
  );
  assert.equal(assignments["thread-100"].assignee.email, "sarah@caley.io");
});

test("Email Assignment: unassignEmail removes assignment cleanly", () => {
  let assignments: Record<string, EmailAssignment> = {};
  assignments = assignEmailToMember(
    assignments,
    "thread-456",
    defaultTeamMembers[0],
  );
  assert.ok(assignments["thread-456"]);

  const unassigned = unassignEmail(assignments, "thread-456");
  assert.equal(unassigned["thread-456"], undefined);
});

test("Email Assignment: filterThreadsByAssignee filters threads correctly", () => {
  const threads = [
    { id: "t-1", subject: "Thread 1" },
    { id: "t-2", subject: "Thread 2" },
    { id: "t-3", subject: "Thread 3" },
    { id: "t-4", subject: "Thread 4" },
  ];

  let assignments: Record<string, EmailAssignment> = {};
  assignments = assignEmailToMember(assignments, "t-1", defaultTeamMembers[0]); // jeremy
  assignments = assignEmailToMember(assignments, "t-2", defaultTeamMembers[1]); // alex
  assignments = assignEmailToMember(assignments, "t-3", defaultTeamMembers[0]); // jeremy
  // t-4 unassigned

  const jeremyThreads = filterThreadsByAssignee(
    threads,
    assignments,
    "jeremy@caley.io",
  );
  assert.equal(jeremyThreads.length, 2);
  assert.deepEqual(
    jeremyThreads.map((t) => t.id),
    ["t-1", "t-3"],
  );

  const alexThreads = filterThreadsByAssignee(
    threads,
    assignments,
    "alex@caley.io",
  );
  assert.equal(alexThreads.length, 1);
  assert.equal(alexThreads[0].id, "t-2");

  const allThreads = filterThreadsByAssignee(threads, assignments, "all");
  assert.equal(allThreads.length, 4);
});
