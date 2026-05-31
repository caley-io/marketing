import { MembershipRole } from "@prisma/client";
import { sendWorkspaceInviteEmail } from "@inboxzero/resend";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { env } from "@/env.mjs";
import { withError } from "@/utils/middleware";
import prisma from "@/utils/prisma";
import {
  getWorkspaceMembership,
  inviteWorkspaceMember,
} from "@/utils/workspace";

const inviteMemberBody = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().max(80).optional(),
  role: z.nativeEnum(MembershipRole).default(MembershipRole.USER),
});

export const GET = withError(async (_request, { params }) => {
  const session = await auth();
  if (!session?.user.email) throw new Error("Not authenticated");
  if (!params.workspaceId) throw new Error("Missing workspace id");

  const membership = await getWorkspaceMembership({
    userId: session.user.id,
    workspaceId: params.workspaceId,
  });

  if (!membership) throw new Error("Workspace not found");

  return NextResponse.json({
    members: membership.organization.membership,
  });
});

export const POST = withError(async (request, { params }) => {
  const session = await auth();
  if (!session?.user.email) throw new Error("Not authenticated");
  if (!params.workspaceId) throw new Error("Missing workspace id");

  const body = inviteMemberBody.parse(await request.json());
  const workspace = await prisma.organization.findUniqueOrThrow({
    where: { id: params.workspaceId },
    select: { id: true, name: true },
  });

  const invite = await inviteWorkspaceMember({
    workspaceId: workspace.id,
    inviterUserId: session.user.id,
    inviterEmail: session.user.email,
    invitedEmail: body.email,
    invitedName: body.name,
    role: body.role,
  });

  await sendWorkspaceInviteEmail({
    to: body.email,
    emailProps: {
      baseUrl: env.NEXT_PUBLIC_BASE_URL,
      invitedByName: session.user.name || session.user.email,
      workspaceName: workspace.name,
      inviteUrl: invite.invitedEmail
        ? `${env.NEXT_PUBLIC_BASE_URL}/api/workspaces/invitations/${invite.id}/accept`
        : `${env.NEXT_PUBLIC_BASE_URL}/mail`,
    },
  });

  return NextResponse.json({ member: invite });
});
