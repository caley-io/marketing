import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { withError } from "@/utils/middleware";
import { inviteWorkspaceMember } from "../../controller";
import { inviteMemberBody } from "../../validation";

export const POST = withError(
  async (
    request: Request,
    { params }: { params: { workspaceId: string } },
  ) => {
    const session = await auth();
    if (!session?.user.email)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const json = await request.json();
    const body = inviteMemberBody.parse(json);

    const membership = await inviteWorkspaceMember({
      requesterId: session.user.id,
      workspaceId: params.workspaceId,
      body,
    });

    return NextResponse.json({ membership }, { status: 201 });
  },
);
