import prisma from "@/utils/prisma";
import type {
  AddEmailAccountBody,
  CreateWorkspaceBody,
  InviteMemberBody,
} from "./validation";

export async function getWorkspacesForUser({
  userId,
  userEmail,
}: {
  userId: string;
  userEmail?: string | null;
}) {
  if (userEmail) {
    // Automatically claim pending invitations matching the authenticated user's email
    await prisma.membership.updateMany({
      where: {
        invitedEmail: userEmail.toLowerCase(),
        userId: null,
      },
      data: {
        userId,
        invitedEmail: null,
        invitedName: null,
      },
    });
  }

  return prisma.organization.findMany({
    where: {
      membership: {
        some: {
          userId,
        },
      },
    },
    include: {
      membership: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
      emailAccounts: {
        select: {
          id: true,
          name: true,
          email: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function createWorkspace({
  userId,
  userEmail,
  userName,
  body,
}: {
  userId: string;
  userEmail?: string | null;
  userName?: string | null;
  body: CreateWorkspaceBody;
}) {
  return prisma.organization.create({
    data: {
      name: body.name,
      image: body.image ?? null,
      membership: {
        create: {
          userId,
          role: "OWNER",
        },
      },
      ...(userEmail
        ? {
            emailAccounts: {
              create: {
                name: userName || body.name,
                email: userEmail.toLowerCase(),
              },
            },
          }
        : {}),
    },
    include: {
      membership: true,
      emailAccounts: true,
    },
  });
}

export async function inviteWorkspaceMember({
  requesterId,
  workspaceId,
  body,
}: {
  requesterId: string;
  workspaceId: string;
  body: InviteMemberBody;
}) {
  const requesterMembership = await prisma.membership.findFirst({
    where: {
      organizationId: workspaceId,
      userId: requesterId,
    },
  });

  if (
    !requesterMembership ||
    (requesterMembership.role !== "OWNER" &&
      requesterMembership.role !== "ADMIN")
  ) {
    throw new Error("Forbidden: Only workspace owners or admins can invite members");
  }

  const normalizedEmail = body.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true, email: true },
  });

  if (existingUser) {
    const existingMember = await prisma.membership.findFirst({
      where: {
        organizationId: workspaceId,
        userId: existingUser.id,
      },
    });

    if (existingMember) {
      return prisma.membership.update({
        where: { id: existingMember.id },
        data: { role: body.role },
      });
    }

    return prisma.membership.create({
      data: {
        organizationId: workspaceId,
        userId: existingUser.id,
        role: body.role,
      },
    });
  }

  return prisma.membership.upsert({
    where: {
      organizationId_invitedEmail: {
        organizationId: workspaceId,
        invitedEmail: normalizedEmail,
      },
    },
    update: {
      role: body.role,
      invitedName: body.name ?? null,
    },
    create: {
      organizationId: workspaceId,
      invitedEmail: normalizedEmail,
      invitedName: body.name ?? null,
      role: body.role,
    },
  });
}

export async function addWorkspaceEmailAccount({
  requesterId,
  workspaceId,
  body,
}: {
  requesterId: string;
  workspaceId: string;
  body: AddEmailAccountBody;
}) {
  const requesterMembership = await prisma.membership.findFirst({
    where: {
      organizationId: workspaceId,
      userId: requesterId,
    },
  });

  if (!requesterMembership) {
    throw new Error("Forbidden: Not a member of this workspace");
  }

  const normalizedEmail = body.email.toLowerCase();
  const existingAccount = await prisma.emailAccount.findFirst({
    where: {
      organizationId: workspaceId,
      email: normalizedEmail,
    },
  });

  if (existingAccount) {
    return prisma.emailAccount.update({
      where: { id: existingAccount.id },
      data: {
        name: body.name,
        ...(body.gmailAccessToken
          ? { gmailAccessToken: body.gmailAccessToken }
          : {}),
        ...(body.gmailRefreshToken
          ? { gmailRefreshToken: body.gmailRefreshToken }
          : {}),
      },
    });
  }

  return prisma.emailAccount.create({
    data: {
      organizationId: workspaceId,
      name: body.name,
      email: normalizedEmail,
      gmailAccessToken: body.gmailAccessToken ?? null,
      gmailRefreshToken: body.gmailRefreshToken ?? null,
    },
  });
}
