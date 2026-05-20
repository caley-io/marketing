import "server-only";

import { MembershipRole } from "@prisma/client";
import prisma from "@/utils/prisma";

export type WorkspaceEmailAccount = {
  id: string;
  name: string;
  email: string;
};

export type WorkspaceSummary = {
  id: string;
  name: string;
  image: string | null;
  role: MembershipRole;
  emailAccounts: WorkspaceEmailAccount[];
};

function getPersonalWorkspaceName(options: {
  name?: string | null;
  email: string;
}) {
  if (options.name) return `${options.name}'s Workspace`;
  return `${options.email.split("@")[0]}'s Workspace`;
}

export async function ensureWorkspaceEmailAccount(options: {
  organizationId: string;
  email: string;
  name?: string | null;
}) {
  const existing = await prisma.emailAccount.findFirst({
    where: {
      organizationId: options.organizationId,
      email: options.email,
    },
  });

  if (existing) return existing;

  return prisma.emailAccount.create({
    data: {
      organizationId: options.organizationId,
      email: options.email,
      name: options.name || options.email,
    },
  });
}

export async function ensurePersonalWorkspaceForUser(options: {
  userId: string;
  email: string;
  name?: string | null;
  image?: string | null;
}) {
  const existingMembership = await prisma.membership.findFirst({
    where: {
      userId: options.userId,
      organization: {
        emailAccounts: {
          some: {
            email: options.email,
          },
        },
      },
    },
    include: {
      organization: true,
    },
  });

  if (existingMembership) {
    await ensureWorkspaceEmailAccount({
      organizationId: existingMembership.organizationId,
      email: options.email,
      name: options.name,
    });
    return existingMembership.organization;
  }

  return prisma.organization.create({
    data: {
      name: getPersonalWorkspaceName(options),
      image: options.image,
      membership: {
        create: {
          userId: options.userId,
          role: MembershipRole.OWNER,
        },
      },
      emailAccounts: {
        create: {
          email: options.email,
          name: options.name || options.email,
        },
      },
    },
  });
}

export async function createWorkspaceForUser(options: {
  userId: string;
  email: string;
  userName?: string | null;
  name: string;
  image?: string | null;
}) {
  return prisma.organization.create({
    data: {
      name: options.name,
      image: options.image,
      membership: {
        create: {
          userId: options.userId,
          role: MembershipRole.OWNER,
        },
      },
      emailAccounts: {
        create: {
          email: options.email,
          name: options.userName || options.email,
        },
      },
    },
    include: {
      emailAccounts: true,
      membership: true,
    },
  });
}

export async function getWorkspacesForUser(userId: string) {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    orderBy: { id: "asc" },
    include: {
      organization: {
        include: {
          emailAccounts: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return memberships.map<WorkspaceSummary>((membership) => ({
    id: membership.organization.id,
    name: membership.organization.name,
    image: membership.organization.image,
    role: membership.role,
    emailAccounts: membership.organization.emailAccounts,
  }));
}

export async function getWorkspaceForUser(options: {
  userId: string;
  workspaceId: string;
}) {
  return prisma.membership.findFirst({
    where: {
      userId: options.userId,
      organizationId: options.workspaceId,
    },
    include: {
      organization: {
        include: {
          emailAccounts: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });
}

export async function inviteWorkspaceMember(options: {
  workspaceId: string;
  inviterUserId: string;
  invitedEmail: string;
  invitedName?: string | null;
  role: MembershipRole;
}) {
  const inviterMembership = await prisma.membership.findFirst({
    where: {
      userId: options.inviterUserId,
      organizationId: options.workspaceId,
      role: {
        in: [MembershipRole.OWNER, MembershipRole.ADMIN],
      },
    },
  });

  if (!inviterMembership) throw new Error("Missing workspace admin access");

  const existingUser = await prisma.user.findUnique({
    where: { email: options.invitedEmail },
    select: { id: true },
  });

  if (existingUser) {
    const existingMembership = await prisma.membership.findFirst({
      where: {
        userId: existingUser.id,
        organizationId: options.workspaceId,
      },
    });

    if (existingMembership) {
      return prisma.membership.update({
        where: { id: existingMembership.id },
        data: { role: options.role },
      });
    }

    return prisma.membership.create({
      data: {
        organizationId: options.workspaceId,
        userId: existingUser.id,
        role: options.role,
      },
    });
  }

  return prisma.membership.upsert({
    where: {
      organizationId_invitedEmail: {
        organizationId: options.workspaceId,
        invitedEmail: options.invitedEmail,
      },
    },
    create: {
      organizationId: options.workspaceId,
      invitedEmail: options.invitedEmail,
      invitedName: options.invitedName || null,
      role: options.role,
    },
    update: {
      invitedName: options.invitedName || null,
      role: options.role,
    },
  });
}

export async function acceptWorkspaceInvitation(options: {
  invitationId: string;
  userId: string;
  email: string;
}) {
  const invitation = await prisma.membership.findUnique({
    where: { id: options.invitationId },
  });

  if (!invitation?.invitedEmail) throw new Error("Invitation not found");

  if (invitation.invitedEmail.toLowerCase() !== options.email.toLowerCase()) {
    throw new Error("Invitation belongs to a different email address");
  }

  return prisma.membership.update({
    where: { id: invitation.id },
    data: {
      userId: options.userId,
      invitedEmail: null,
      invitedName: null,
    },
  });
}
