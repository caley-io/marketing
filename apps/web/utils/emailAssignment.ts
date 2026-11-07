import { z } from "zod";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: "admin" | "member" | "viewer";
}

export interface EmailAssignment {
  threadId: string;
  assignee: TeamMember;
  assignedBy: string;      // Email or user name
  assignedAt: string;      // ISO string
  notes?: string;
}

export const teamMemberSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  avatarUrl: z.string().optional(),
  role: z.enum(["admin", "member", "viewer"]).default("member"),
});

export const emailAssignmentSchema = z.object({
  threadId: z.string().min(1, "Thread ID required"),
  assignee: teamMemberSchema,
  assignedBy: z.string().min(1, "Assigner required"),
  assignedAt: z.string(),
  notes: z.string().optional(),
});

export const assignPayloadSchema = z.object({
  threadId: z.string(),
  memberEmail: z.string().email(),
  notes: z.string().optional(),
});

export const defaultTeamMembers: TeamMember[] = [
  {
    id: "member-1",
    name: "Jeremy Scatigna",
    email: "jeremy@caley.io",
    role: "admin",
  },
  {
    id: "member-2",
    name: "Alex Smith",
    email: "alex@caley.io",
    role: "member",
  },
  {
    id: "member-3",
    name: "Sarah Chen",
    email: "sarah@caley.io",
    role: "member",
  },
  {
    id: "member-4",
    name: "David Kim",
    email: "david@caley.io",
    role: "member",
  },
];

/**
 * Assigns an email thread to a team member.
 */
export function assignEmailToMember(
  assignments: Record<string, EmailAssignment>,
  threadId: string,
  assignee: TeamMember,
  assignedBy: string = "current_user",
  notes?: string,
): Record<string, EmailAssignment> {
  const newAssignment: EmailAssignment = {
    threadId,
    assignee,
    assignedBy,
    assignedAt: new Date().toISOString(),
    notes,
  };

  return {
    ...assignments,
    [threadId]: newAssignment,
  };
}

/**
 * Removes assignment for a given email thread.
 */
export function unassignEmail(
  assignments: Record<string, EmailAssignment>,
  threadId: string,
): Record<string, EmailAssignment> {
  const copy = { ...assignments };
  delete copy[threadId];
  return copy;
}

/**
 * Filters email threads by assigned team member email.
 */
export function filterThreadsByAssignee<T extends { id?: string }>(
  threads: T[],
  assignments: Record<string, EmailAssignment>,
  assigneeEmail: string,
): T[] {
  if (!assigneeEmail || assigneeEmail === "all") return threads;

  return threads.filter((t) => {
    if (!t.id) return false;
    const assignment = assignments[t.id];
    return assignment?.assignee.email.toLowerCase() === assigneeEmail.toLowerCase();
  });
}
