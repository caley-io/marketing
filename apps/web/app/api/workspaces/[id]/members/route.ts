import { MembershipRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { withError } from "@/utils/middleware";
import prisma from "@/utils/prisma";
import { canManageWorkspace, getWorkspacesForUser } from "@/utils/workspace";

const inviteMemberBody = z.object({
  email: z.string().trim().email().max(255),
  name: z.string().trim().max(80).optional(),
  role: z.nativeEnum(MembershipRole).default(MembershipRole.USER),
});

export const POST = withError(
  async (
    request: NextRequest,
    { params }: { params: { id?: string | undefined } },
  ) => {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const organizationId = params.id;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Missing workspace id" },
        { status: 400 },
      );
    }

    const canManage = await canManageWorkspace({
      userId: session.user.id,
      organizationId,
    });
    if (!canManage) {
      return NextResponse.json(
        { error: "You do not have permission to manage this workspace" },
        { status: 403 },
      );
    }

    const body = inviteMemberBody.parse(await request.json());
    await prisma.membership.upsert({
      where: {
        organizationId_invitedEmail: {
          organizationId,
          invitedEmail: body.email,
        },
      },
      update: {
        invitedName: body.name,
        role: body.role,
      },
      create: {
        organizationId,
        invitedEmail: body.email,
        invitedName: body.name,
        role: body.role,
      },
    });

    return NextResponse.json({
      workspaces: await getWorkspacesForUser(session.user.id),
    });
  },
);
