import { auth } from "@/app/api/auth/[...nextauth]/auth";
import prisma from "@/utils/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(80),
  image: z.string().trim().url().optional().nullable(),
});

async function canManageWorkspace(workspaceId: string, userId: string) {
  const membership = await prisma.membership.findFirst({
    where: {
      organizationId: workspaceId,
      userId,
    },
    select: { role: true },
  });

  return membership?.role === "OWNER" || membership?.role === "ADMIN";
}

export async function PATCH(
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

  const parsed = updateWorkspaceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid workspace payload" },
      { status: 400 },
    );
  }

  const workspace = await prisma.organization.update({
    where: { id: params.workspaceId },
    data: {
      name: parsed.data.name,
      image: parsed.data.image || null,
    },
    select: {
      id: true,
      name: true,
      image: true,
    },
  });

  return NextResponse.json({ workspace });
}
