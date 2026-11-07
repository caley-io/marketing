import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { withError } from "@/utils/middleware";
import {
  addWorkspaceEmailAccount,
  removeWorkspaceEmailAccount,
} from "@/utils/workspace";
import { prismaWorkspaceRepository } from "@/utils/workspace-prisma";

const linkAccountBody = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  provider: z.enum(["gmail", "google_workspace"]).default("gmail"),
  gmailAccessToken: z.string().min(1).optional(),
  gmailRefreshToken: z.string().min(1).optional(),
});

const removeAccountBody = z.object({
  accountId: z.string().min(1),
});

// Connects an additional Gmail or Google Workspace inbox account to an existing
// workspace so team members can collaborate across multiple email addresses.
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
  const body = linkAccountBody.parse(json);

  const emailAccount = await addWorkspaceEmailAccount(
    prismaWorkspaceRepository,
    {
      actorUserId: session.user.id,
      workspaceId,
      name: body.name,
      email: body.email,
      provider: body.provider,
      gmailAccessToken: body.gmailAccessToken,
      gmailRefreshToken: body.gmailRefreshToken,
    },
  );

  return NextResponse.json({ emailAccount }, { status: 201 });
});

// Removes a linked Gmail or Google Workspace account from the target workspace.
export const DELETE = withError(async (request, { params }) => {
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
  const body = removeAccountBody.parse(json);

  await removeWorkspaceEmailAccount(prismaWorkspaceRepository, {
    actorUserId: session.user.id,
    workspaceId,
    accountId: body.accountId,
  });

  return NextResponse.json({ deleted: true });
});
