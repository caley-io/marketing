import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { withError } from "@/utils/middleware";
import {
  getWorkspaceMembership,
  serializeWorkspace,
  updateWorkspaceForUser,
} from "@/utils/workspace";

const updateWorkspaceBody = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  image: z.string().url().nullable().optional(),
});

export const GET = withError(async (_request, { params }) => {
  const session = await auth();
  if (!session?.user.email) throw new Error("Not authenticated");
  if (!params.workspaceId) throw new Error("Missing workspace id");

  const membership = await getWorkspaceMembership({
    userId: session.user.id,
    workspaceId: params.workspaceId,
  });

  return NextResponse.json({ workspace: serializeWorkspace(membership) });
});

export const PATCH = withError(async (request, { params }) => {
  const session = await auth();
  if (!session?.user.email) throw new Error("Not authenticated");
  if (!params.workspaceId) throw new Error("Missing workspace id");

  const body = updateWorkspaceBody.parse(await request.json());
  const membership = await updateWorkspaceForUser({
    userId: session.user.id,
    workspaceId: params.workspaceId,
    name: body.name,
    image: body.image,
  });

  return NextResponse.json({ workspace: serializeWorkspace(membership) });
});
