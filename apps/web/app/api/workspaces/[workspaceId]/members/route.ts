import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import prisma from "@/utils/prisma";
import { withError } from "@/utils/middleware";
import {
  getActorMembership,
  inviteMemberBody,
  inviteWorkspaceMember,
  removeWorkspaceMember,
  updateMemberRoleBody,
  updateWorkspaceMemberRole,
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

  const members = await prisma.membership.findMany({
    where: { organizationId: workspaceId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });

  return NextResponse.json({ members });
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
  const body = inviteMemberBody.parse(json);

  try {
    const member = await inviteWorkspaceMember(
      prisma,
      session.user.id,
      workspaceId,
      body,
    );
    return NextResponse.json({ member }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unable to invite member" },
      { status: 403 },
    );
  }
});

export const PATCH = withError(async (request, { params }) => {
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
  const body = updateMemberRoleBody.parse(json);

  try {
    const member = await updateWorkspaceMemberRole(
      prisma,
      session.user.id,
      workspaceId,
      body.membershipId,
      body.role,
    );
    return NextResponse.json({ member });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unable to update member role" },
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
  const membershipId = new URL(request.url).searchParams.get("membershipId");
  if (!workspaceId || !membershipId) {
    return NextResponse.json(
      { error: "Workspace ID and membershipId are required" },
      { status: 400 },
    );
  }

  try {
    await removeWorkspaceMember(
      prisma,
      session.user.id,
      workspaceId,
      membershipId,
    );
    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unable to remove member" },
      { status: 403 },
    );
  }
});
