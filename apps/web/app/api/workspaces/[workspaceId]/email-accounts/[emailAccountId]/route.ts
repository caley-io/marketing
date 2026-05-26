import { auth } from "@/app/api/auth/[...nextauth]/auth";
import prisma from "@/utils/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateEmailAccountSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  email: z
    .string()
    .trim()
    .email()
    .max(255)
    .transform((email) => email.toLowerCase())
    .optional(),
});

async function canManageWorkspace(workspaceId: string, userId: string) {
  const membership = await prisma.membership.findFirst({
    where: {
      organizationId: workspaceId,
      userId,
    },
  });

  return membership?.role === "OWNER" || membership?.role === "ADMIN";
}

async function getEmailAccount(workspaceId: string, emailAccountId: string) {
  return prisma.emailAccount.findFirst({
    where: {
      id: emailAccountId,
      organizationId: workspaceId,
    },
    select: {
      id: true,
      email: true,
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: { workspaceId: string; emailAccountId: string } },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!(await canManageWorkspace(params.workspaceId, session.user.id))) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const targetEmailAccount = await getEmailAccount(
    params.workspaceId,
    params.emailAccountId,
  );
  if (!targetEmailAccount) {
    return NextResponse.json(
      { error: "Email account not found" },
      { status: 404 },
    );
  }

  const parsed = updateEmailAccountSchema.safeParse(await request.json());
  if (!parsed.success || (!parsed.data.name && !parsed.data.email)) {
    return NextResponse.json(
      { error: "Invalid email account payload" },
      { status: 400 },
    );
  }

  if (parsed.data.email && parsed.data.email !== targetEmailAccount.email) {
    const existingEmailAccount = await prisma.emailAccount.findFirst({
      where: {
        organizationId: params.workspaceId,
        email: parsed.data.email,
        NOT: { id: targetEmailAccount.id },
      },
    });
    if (existingEmailAccount) {
      return NextResponse.json(
        { error: "Email account already exists in this workspace" },
        { status: 409 },
      );
    }
  }

  const emailAccount = await prisma.emailAccount.update({
    where: { id: targetEmailAccount.id },
    data: parsed.data,
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  return NextResponse.json({ emailAccount });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { workspaceId: string; emailAccountId: string } },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!(await canManageWorkspace(params.workspaceId, session.user.id))) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const targetEmailAccount = await getEmailAccount(
    params.workspaceId,
    params.emailAccountId,
  );
  if (!targetEmailAccount) {
    return NextResponse.json(
      { error: "Email account not found" },
      { status: 404 },
    );
  }

  await prisma.emailAccount.delete({
    where: { id: targetEmailAccount.id },
  });

  return NextResponse.json({ success: true });
}
