import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { withError } from "@/utils/middleware";
import { createWorkspace, getWorkspacesForUser } from "./controller";
import { createWorkspaceBody } from "./validation";

export const GET = withError(async () => {
  const session = await auth();
  if (!session?.user.email)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const workspaces = await getWorkspacesForUser({
    userId: session.user.id,
    userEmail: session.user.email,
  });

  return NextResponse.json({ workspaces });
});

export const POST = withError(async (request: Request) => {
  const session = await auth();
  if (!session?.user.email)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const json = await request.json();
  const body = createWorkspaceBody.parse(json);

  const workspace = await createWorkspace({
    userId: session.user.id,
    userEmail: session.user.email,
    userName: session.user.name,
    body,
  });

  return NextResponse.json({ workspace }, { status: 201 });
});
