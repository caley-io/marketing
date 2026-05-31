import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { withError } from "@/utils/middleware";
import { removeWorkspaceEmailAccount } from "@/utils/workspace";

export const DELETE = withError(async (_request, { params }) => {
  const session = await auth();
  if (!session?.user.email) throw new Error("Not authenticated");
  if (!params.workspaceId || !params.emailAccountId)
    throw new Error("Missing workspace email account");

  return NextResponse.json(
    await removeWorkspaceEmailAccount({
      userId: session.user.id,
      workspaceId: params.workspaceId,
      emailAccountId: params.emailAccountId,
    }),
  );
});
