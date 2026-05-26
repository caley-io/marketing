import { auth } from "@/app/api/auth/[...nextauth]/auth";
import prisma from "@/utils/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateMemberSchema = z.object({
  role: z.enum(["ADMIN", "USER"]),
});

async function getOwnerMembership(workspaceId: string, userId: string) {
  return prisma.membership.findFirst({
    where: {
      organizationId: workspaceId,
      userId,
      role: "OWNER",
    },
  });
}

async function getTargetMembership(workspaceId: string, memberId: string) {
  return prisma.membership.findFirst({
    where: {
      id: memberId,
      organizationId: workspaceId,
    },
    select: {
      id: true,
      role: true,
      userId: true,
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: { workspaceId: string; memberId: string } },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!(await getOwnerMembership(params.workspaceId, session.user.id))) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const targetMembership = await getTargetMembership(
    params.workspaceId,
    params.memberId,
  );
  if (!targetMembership) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  if (targetMembership.role === "OWNER") {
    return NextResponse.json(
      { error: "Owner role cannot be changed" },
      { status: 400 },
    );
  }

  const parsed = updateMemberSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid member payload" },
      { status: 400 },
    );
  }

  const member = await prisma.membership.update({
    where: { id: targetMembership.id },
    data: { role: parsed.data.role },
    select: {
      id: true,
      role: true,
      invitedName: true,
      invitedEmail: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return NextResponse.json({ member });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { workspaceId: string; memberId: string } },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!(await getOwnerMembership(params.workspaceId, session.user.id))) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const targetMembership = await getTargetMembership(
    params.workspaceId,
    params.memberId,
  );
  if (!targetMembership) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  if (targetMembership.role === "OWNER") {
    return NextResponse.json(
      { error: "Owner membership cannot be removed" },
      { status: 400 },
    );
  }

  await prisma.membership.delete({
    where: { id: targetMembership.id },
  });

  return NextResponse.json({ success: true });
}
