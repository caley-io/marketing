import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { env } from "@/env.mjs";
import { withError } from "@/utils/middleware";
import { acceptWorkspaceInvitation } from "@/utils/workspace";

export const GET = withError(async (_request, { params }) => {
  const session = await auth();
  if (!session?.user.email) {
    return NextResponse.redirect(`${env.NEXT_PUBLIC_BASE_URL}/login`);
  }
  if (!params.invitationId) throw new Error("Missing invitation id");

  await acceptWorkspaceInvitation({
    invitationId: params.invitationId,
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
  });

  return NextResponse.redirect(`${env.NEXT_PUBLIC_BASE_URL}/mail`);
});
