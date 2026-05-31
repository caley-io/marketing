import { MembershipRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { withError } from "@/utils/middleware";
import {
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
} from "@/utils/workspace";

const updateMemberBody = z.object({
  role: z.nativeEnum(MembershipRole),
});

export const PATCH = withError(async (request, { params }) => {
  const session = await auth();
  if (!session?.user.email) throw new Error("Not authenticated");
  if (!params.workspaceId || !params.memberId)
    throw new Error("Missing workspace member");

  const body = updateMemberBody.parse(await request.json());
  const member = await updateWorkspaceMemberRole({
    userId: session.user.id,
    workspaceId: params.workspaceId,
    memberId: params.memberId,
    role: body.role,
  });

  return NextResponse.json({ member });
});

export const DELETE = withError(async (_request, { params }) => {
  const session = await auth();
  if (!session?.user.email) throw new Error("Not authenticated");
  if (!params.workspaceId || !params.memberId)
    throw new Error("Missing workspace member");

  return NextResponse.json(
    await removeWorkspaceMember({
      userId: session.user.id,
      workspaceId: params.workspaceId,
      memberId: params.memberId,
    }),
  );
});
