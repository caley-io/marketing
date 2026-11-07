import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { withError } from "@/utils/middleware";
import {
  addWorkspaceEmailAccount,
  createWorkspace,
  inviteWorkspaceMember,
} from "@/utils/workspace";
import { prismaWorkspaceRepository } from "@/utils/workspace-prisma";

const createWorkspaceRequestBody = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(240).optional(),
  image: z.string().url().optional(),
  invites: z
    .array(
      z.object({
        email: z.string().trim().email(),
        name: z.string().trim().max(120).optional(),
        role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
      }),
    )
    .optional(),
  emailAccounts: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        email: z.string().trim().email(),
        provider: z.enum(["gmail", "google_workspace"]).default("gmail"),
        gmailAccessToken: z.string().optional(),
        gmailRefreshToken: z.string().optional(),
      }),
    )
    .optional(),
});

// Lists all workspaces where the authenticated user holds an active membership,
// returning linked Gmail/Google Workspace accounts and team members.
export const GET = withError(async () => {
  const session = await auth();
  if (!session?.user.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const workspaces = await prismaWorkspaceRepository.listUserWorkspaces(
    session.user.id,
  );
  return NextResponse.json({ workspaces });
});

async function applyInitialInvitesAndAccounts(
  workspaceId: string,
  options: {
    actorUserId: string;
    body: z.infer<typeof createWorkspaceRequestBody>;
  },
): Promise<void> {
  const invites = options.body.invites ?? [];
  for (const invite of invites) {
    await inviteWorkspaceMember(prismaWorkspaceRepository, {
      actorUserId: options.actorUserId,
      workspaceId,
      invitedEmail: invite.email,
      invitedName: invite.name,
      role: invite.role,
    });
  }

  const accounts = options.body.emailAccounts ?? [];
  for (const account of accounts) {
    await addWorkspaceEmailAccount(prismaWorkspaceRepository, {
      actorUserId: options.actorUserId,
      workspaceId,
      name: account.name,
      email: account.email,
      provider: account.provider,
      gmailAccessToken: account.gmailAccessToken,
      gmailRefreshToken: account.gmailRefreshToken,
    });
  }
}

// Creates a new workspace owned by the authenticated user and optionally
// seeds initial team invitations and connected Google email accounts.
export const POST = withError(async (request) => {
  const session = await auth();
  if (!session?.user.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const json = await request.json();
  const body = createWorkspaceRequestBody.parse(json);

  const created = await createWorkspace(prismaWorkspaceRepository, {
    actorUserId: session.user.id,
    name: body.name,
    description: body.description,
    image: body.image,
  });

  await applyInitialInvitesAndAccounts(created.id, {
    actorUserId: session.user.id,
    body,
  });

  const hydrated = await prismaWorkspaceRepository.findWorkspaceById(created.id);
  return NextResponse.json({ workspace: hydrated ?? created }, { status: 201 });
});
