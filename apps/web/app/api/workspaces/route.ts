import { MembershipRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { withError } from "@/utils/middleware";
import {
  createWorkspaceForUser,
  ensurePersonalWorkspaceForUser,
  getWorkspacesForUser,
  serializeWorkspace,
} from "@/utils/workspace";

const createWorkspaceBody = z.object({
  name: z.string().trim().min(1).max(80),
  image: z.string().url().nullish(),
});

async function getWorkspaces() {
  const session = await auth();
  if (!session?.user.email) throw new Error("Not authenticated");

  await ensurePersonalWorkspaceForUser({
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  return { workspaces: await getWorkspacesForUser(session.user.id) };
}

export const GET = withError(async () => {
  return NextResponse.json(await getWorkspaces());
});

export const POST = withError(async (request: Request) => {
  const session = await auth();
  if (!session?.user.email) throw new Error("Not authenticated");

  const body = createWorkspaceBody.parse(await request.json());
  const membership = await createWorkspaceForUser({
    userId: session.user.id,
    email: session.user.email,
    userName: session.user.name,
    name: body.name,
    image: body.image || null,
  });

  return NextResponse.json({
    workspace: {
      ...serializeWorkspace(membership),
      role: MembershipRole.OWNER,
    },
  });
});
