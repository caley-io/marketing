import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { withError } from "@/utils/middleware";
import prisma from "@/utils/prisma";

export const GET = withError(
  async (
    request: NextRequest,
    { params }: { params: { id?: string | undefined } },
  ) => {
    const inviteId = params.id;
    const mailUrl = new URL("/mail", request.url);

    if (!inviteId) {
      return NextResponse.redirect(mailUrl);
    }

    const session = await auth();
    if (!session?.user.id || !session.user.email) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", request.url);
      return NextResponse.redirect(loginUrl);
    }

    const membership = await prisma.membership.findUnique({
      where: { id: inviteId },
      select: {
        id: true,
        invitedEmail: true,
        organizationId: true,
      },
    });

    if (!membership?.invitedEmail) {
      return NextResponse.redirect(mailUrl);
    }

    if (
      membership.invitedEmail.toLowerCase() !== session.user.email.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "This invitation was sent to a different email address" },
        { status: 403 },
      );
    }

    const existingMembership = await prisma.membership.findFirst({
      where: {
        organizationId: membership.organizationId,
        userId: session.user.id,
      },
      select: { id: true },
    });

    if (existingMembership && existingMembership.id !== membership.id) {
      await prisma.membership.delete({ where: { id: membership.id } });
    } else {
      await prisma.membership.update({
        where: { id: membership.id },
        data: {
          userId: session.user.id,
          invitedEmail: null,
          invitedName: null,
        },
      });
    }

    mailUrl.searchParams.set("workspaceId", membership.organizationId);
    return NextResponse.redirect(mailUrl);
  },
);
