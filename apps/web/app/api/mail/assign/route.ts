import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { withError } from "@/utils/middleware";
import {
  assignPayloadSchema,
  defaultTeamMembers,
  EmailAssignment,
} from "@/utils/emailAssignment";

export const dynamic = "force-dynamic";

// In-memory assignment storage for demo/mock persistence across requests
const threadAssignments: Record<string, EmailAssignment> = {};

export const GET = withError(async (request: Request) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get("threadId");

  if (threadId) {
    const assignment = threadAssignments[threadId] || null;
    return NextResponse.json({ assignment });
  }

  return NextResponse.json({
    assignments: threadAssignments,
    teamMembers: defaultTeamMembers,
  });
});

export const POST = withError(async (request: Request) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { threadId, memberEmail, notes } = assignPayloadSchema.parse(body);

  if (memberEmail === "unassign") {
    delete threadAssignments[threadId];
    return NextResponse.json({ success: true, threadId, unassigned: true });
  }

  const member = defaultTeamMembers.find(
    (m) => m.email.toLowerCase() === memberEmail.toLowerCase(),
  );

  if (!member) {
    return NextResponse.json(
      { error: "Team member not found" },
      { status: 404 },
    );
  }

  const assignment: EmailAssignment = {
    threadId,
    assignee: member,
    assignedBy: session.user.email || "Current User",
    assignedAt: new Date().toISOString(),
    notes,
  };

  threadAssignments[threadId] = assignment;

  return NextResponse.json({
    success: true,
    assignment,
  });
});
