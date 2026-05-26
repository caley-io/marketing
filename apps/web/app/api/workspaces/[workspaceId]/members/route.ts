import { auth } from "@/app/api/auth/[...nextauth]/auth";
import prisma from "@/utils/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const inviteMemberSchema = z.object({
  name: z.string().trim().max(80).optional(),
  email: z
    .string()
    .trim()
    .email()
    .max(255)
    .transform((email) => email.toLowerCase()),
  role: z.enum(["ADMIN", "USER"]).default("USER"),
});

async function getWorkspaceMembership(workspaceId: string, userId: string) {
  return prisma.membership.findFirst({
    where: {
      organizationId: workspaceId,
      userId,
    },
  });
}

async function canManageWorkspace(workspaceId: string, userId: string) {
  const membership = await getWorkspaceMembership(workspaceId, userId);
  return membership?.role === "OWNER" || membership?.role === "ADMIN";
}

export async function GET(
  _request: Request,
  { params }: { params: { workspaceId: string } },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const membership = await getWorkspaceMembership(
    params.workspaceId,
    session.user.id,
  );
  if (!membership) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const members = await prisma.membership.findMany({
    where: { organizationId: params.workspaceId },
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
    orderBy: { id: "asc" },
  });

  return NextResponse.json({ members });
}

export async function POST(
  request: Request,
  { params }: { params: { workspaceId: string } },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!(await canManageWorkspace(params.workspaceId, session.user.id))) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const parsed = inviteMemberSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid member invite payload" },
      { status: 400 },
    );
  }

  const existingMembership = await prisma.membership.findFirst({
    where: {
      organizationId: params.workspaceId,
      OR: [
        { invitedEmail: parsed.data.email },
        { user: { email: parsed.data.email } },
      ],
    },
  });
  if (existingMembership) {
    return NextResponse.json(
      { error: "Member already belongs to this workspace" },
      { status: 409 },
    );
  }

  const member = await prisma.membership.create({
    data: {
      organizationId: params.workspaceId,
      role: parsed.data.role,
      invitedName: parsed.data.name || null,
      invitedEmail: parsed.data.email,
    },
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

  return NextResponse.json({ member }, { status: 201 });
}
