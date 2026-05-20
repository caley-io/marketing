import { MembershipRole } from "@prisma/client";
import { sendWorkspaceInviteEmail } from "@inboxzero/resend";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { env } from "@/env.mjs";
import { withError } from "@/utils/middleware";
import {
  createWorkspaceForUser,
  ensurePersonalWorkspaceForUser,
  getWorkspacesForUser,
  inviteWorkspaceMember,
} from "@/utils/workspace";

const createWorkspaceBody = z.object({
  name: z.string().trim().min(1).max(80),
  image: z.string().url().nullish(),
  inviteEmail: z.string().trim().email().optional().or(z.literal("")),
  inviteName: z.string().trim().max(80).optional(),
  inviteRole: z.nativeEnum(MembershipRole).optional(),
});

export type WorkspacesResponse = Awaited<ReturnType<typeof getWorkspaces>>;
export type CreateWorkspaceResponse = Awaited<
  ReturnType<typeof createWorkspace>
>;

async function getWorkspaces() {
  const session = await auth();
  if (!session?.user.email) throw new Error("Not authenticated");

  await ensurePersonalWorkspaceForUser({
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  const workspaces = await getWorkspacesForUser(session.user.id);
  return { workspaces };
}

async function createWorkspace(options: z.infer<typeof createWorkspaceBody>) {
  const session = await auth();
  if (!session?.user.email) throw new Error("Not authenticated");

  const workspace = await createWorkspaceForUser({
    userId: session.user.id,
    email: session.user.email,
    userName: session.user.name,
    name: options.name,
    image: options.image || null,
  });

  if (options.inviteEmail) {
    const invite = await inviteWorkspaceMember({
      workspaceId: workspace.id,
      inviterUserId: session.user.id,
      invitedEmail: options.inviteEmail,
      invitedName: options.inviteName,
      role: options.inviteRole || MembershipRole.USER,
    });

    await sendWorkspaceInviteEmail({
      to: options.inviteEmail,
      emailProps: {
        baseUrl: env.NEXT_PUBLIC_BASE_URL,
        invitedByName: session.user.name || session.user.email,
        workspaceName: workspace.name,
        inviteUrl: invite.invitedEmail
          ? `${env.NEXT_PUBLIC_BASE_URL}/api/workspaces/invitations/${invite.id}/accept`
          : `${env.NEXT_PUBLIC_BASE_URL}/mail`,
      },
    });
  }

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      image: workspace.image,
      role: MembershipRole.OWNER,
      emailAccounts: workspace.emailAccounts.map((account) => ({
        id: account.id,
        name: account.name,
        email: account.email,
      })),
    },
  };
}

export const GET = withError(async () => {
  return NextResponse.json(await getWorkspaces());
});

export const POST = withError(async (request: Request) => {
  const body = createWorkspaceBody.parse(await request.json());
  return NextResponse.json(await createWorkspace(body));
});
