import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { withError } from "@/utils/middleware";
import {
  addCurrentUserEmailAccount,
  getWorkspaceMembership,
} from "@/utils/workspace";

export const GET = withError(async (_request, { params }) => {
  const session = await auth();
  if (!session?.user.email) throw new Error("Not authenticated");
  if (!params.workspaceId) throw new Error("Missing workspace id");

  const membership = await getWorkspaceMembership({
    userId: session.user.id,
    workspaceId: params.workspaceId,
  });

  if (!membership) throw new Error("Workspace not found");

  return NextResponse.json({
    emailAccounts: membership.organization.emailAccounts.map((account) => ({
      id: account.id,
      name: account.name,
      email: account.email,
    })),
  });
});

export const POST = withError(async (_request, { params }) => {
  const session = await auth();
  if (!session?.user.email) throw new Error("Not authenticated");
  if (!params.workspaceId) throw new Error("Missing workspace id");

  const emailAccount = await addCurrentUserEmailAccount({
    userId: session.user.id,
    workspaceId: params.workspaceId,
    email: session.user.email,
    name: session.user.name,
  });

  return NextResponse.json({ emailAccount });
});
