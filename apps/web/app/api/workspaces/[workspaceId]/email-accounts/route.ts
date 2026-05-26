import { auth } from "@/app/api/auth/[...nextauth]/auth";
import prisma from "@/utils/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const emailAccountSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z
    .string()
    .trim()
    .email()
    .max(255)
    .transform((email) => email.toLowerCase()),
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

  const emailAccounts = await prisma.emailAccount.findMany({
    where: { organizationId: params.workspaceId },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ emailAccounts });
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

  const parsed = emailAccountSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid email account payload" },
      { status: 400 },
    );
  }

  const accountCount = await prisma.emailAccount.count({
    where: { organizationId: params.workspaceId },
  });
  if (accountCount >= 10) {
    return NextResponse.json(
      { error: "A workspace can have up to 10 email accounts" },
      { status: 400 },
    );
  }

  const existingEmailAccount = await prisma.emailAccount.findFirst({
    where: {
      organizationId: params.workspaceId,
      email: parsed.data.email,
    },
  });
  if (existingEmailAccount) {
    return NextResponse.json(
      { error: "Email account already exists in this workspace" },
      { status: 409 },
    );
  }

  const emailAccount = await prisma.emailAccount.create({
    data: {
      organizationId: params.workspaceId,
      name: parsed.data.name,
      email: parsed.data.email,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  return NextResponse.json({ emailAccount }, { status: 201 });
}
