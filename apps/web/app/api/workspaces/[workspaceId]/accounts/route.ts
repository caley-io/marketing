import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import prisma from "@/utils/prisma";
import { withError } from "@/utils/middleware";
import {
  addEmailAccountBody,
  addWorkspaceEmailAccount,
  getActorMembership,
  removeWorkspaceEmailAccount,
} from "@/utils/workspaces";

export const GET = withError(async (_request, { params }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const workspaceId = params.workspaceId;
  if (!workspaceId) {
    return NextResponse.json(
      { error: "Workspace ID is required" },
      { status: 400 },
    );
  }

  const membership = await getActorMembership(
    prisma,
    session.user.id,
    workspaceId,
  );
  if (!membership) {
    return NextResponse.json(
      { error: "Not a member of this workspace" },
      { status: 403 },
    );
  }

  const accounts = await prisma.emailAccount.findMany({
    where: { organizationId: workspaceId },
  });

  return NextResponse.json({ accounts });
});

export const POST = withError(async (request, { params }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const workspaceId = params.workspaceId;
  if (!workspaceId) {
    return NextResponse.json(
      { error: "Workspace ID is required" },
      { status: 400 },
    );
  }

  const json = await request.json();
  const body = addEmailAccountBody.parse(json);

  try {
    const account = await addWorkspaceEmailAccount(
      prisma,
      session.user.id,
      workspaceId,
      body,
    );
    return NextResponse.json({ account }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unable to add email account" },
      { status: 403 },
    );
  }
});

export const DELETE = withError(async (request, { params }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const workspaceId = params.workspaceId;
  const accountId = new URL(request.url).searchParams.get("accountId");
  if (!workspaceId || !accountId) {
    return NextResponse.json(
      { error: "Workspace ID and accountId are required" },
      { status: 400 },
    );
  }

  try {
    await removeWorkspaceEmailAccount(
      prisma,
      session.user.id,
      workspaceId,
      accountId,
    );
    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unable to remove email account" },
      { status: 403 },
    );
  }
});
