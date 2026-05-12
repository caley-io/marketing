import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { withError } from "@/utils/middleware";
import {
  createWorkspaceForUser,
  getWorkspacesForUser,
} from "@/utils/workspace";

const createWorkspaceBody = z.object({
  name: z.string().trim().min(1).max(80),
  image: z.string().url().nullish(),
});

export type WorkspacesResponse = Awaited<ReturnType<typeof workspacesResponse>>;

async function workspacesResponse(userId: string, workspaceId?: string) {
  return { workspaces: await getWorkspacesForUser(userId), workspaceId };
}

export const GET = withError(async () => {
  const session = await auth();
  if (!session?.user.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json(await workspacesResponse(session.user.id));
});

export const POST = withError(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = createWorkspaceBody.parse(await request.json());
  const workspaceId = await createWorkspaceForUser({
    userId: session.user.id,
    name: body.name,
    image: body.image,
    email: session.user.email,
    userName: session.user.name,
  });

  return NextResponse.json(
    await workspacesResponse(session.user.id, workspaceId),
  );
});
