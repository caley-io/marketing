import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import prisma from "@/utils/prisma";
import { withError } from "@/utils/middleware";
import {
  createWorkspace,
  createWorkspaceBody,
  listUserWorkspaces,
} from "@/utils/workspaces";

export type WorkspacesResponse = Awaited<ReturnType<typeof listUserWorkspaces>>;

export const GET = withError(async () => {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const workspaces = await listUserWorkspaces(prisma, {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  });

  return NextResponse.json({ workspaces });
});

export const POST = withError(async (request) => {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const json = await request.json();
  const body = createWorkspaceBody.parse(json);

  const workspace = await createWorkspace(
    prisma,
    {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    },
    body,
  );

  return NextResponse.json({ workspace }, { status: 201 });
});
