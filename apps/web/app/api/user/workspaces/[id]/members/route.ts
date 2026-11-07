import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { withError } from "@/utils/middleware";
import {
  acceptWorkspaceInvitation,
  inviteWorkspaceMember,
} from "@/utils/workspace";
import { prismaWorkspaceRepository } from "@/utils/workspace-prisma";

const inviteMemberBody = z.object({
  invitedEmail: z.string().trim().email(),
  invitedName: z.string().trim().min(1).max(120).optional(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
});

// Dispatches a role-scoped workspace email invitation for the target organization.
export const POST = withError(async (request, { params }) => {
  const session = await auth();
  if (!session?.user.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const workspaceId = params.id;
  if (!workspaceId) {
    return NextResponse.json(
      { error: "Missing workspace identifier" },
      { status: 400 },
    );
  }

  const json = await request.json();
  const body = inviteMemberBody.parse(json);

  const membership = await inviteWorkspaceMember(prismaWorkspaceRepository, {
    actorUserId: session.user.id,
    workspaceId,
    invitedEmail: body.invitedEmail,
    invitedName: body.invitedName,
    role: body.role,
  });

  return NextResponse.json({ membership }, { status: 201 });
});

// Accepts a pending email invitation for the currently authenticated user
// and binds their user ID to the workspace membership record.
export const PUT = withError(async (_request, { params }) => {
  const session = await auth();
  if (!session?.user.id || !session?.user.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const workspaceId = params.id;
  if (!workspaceId) {
    return NextResponse.json(
      { error: "Missing workspace identifier" },
      { status: 400 },
    );
  }

  const membership = await acceptWorkspaceInvitation(prismaWorkspaceRepository, {
    workspaceId,
    userId: session.user.id,
    userEmail: session.user.email,
  });

  return NextResponse.json({ membership });
});
