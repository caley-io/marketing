import "server-only";

import { MembershipRole, type Account } from "@prisma/client";
import prisma from "@/utils/prisma";
import type { WorkspaceSummary } from "@/utils/workspace-types";

function getPersonalWorkspaceName(options: {
  name?: string | null;
  email: string;
}) {
  if (options.name) return `${options.name}'s Workspace`;
  return `${options.email.split("@")[0]}'s Workspace`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function accountExpiryDate(account?: Pick<Account, "expires_at"> | null) {
  return account?.expires_at ? new Date(account.expires_at * 1000) : null;
}

async function getGoogleAccountForUser(userId: string) {
  return prisma.account.findFirst({
    where: { userId, provider: "google" },
    orderBy: { updatedAt: "desc" },
  });
}

export async function upsertWorkspaceEmailAccount(options: {
  organizationId: string;
  userId: string;
  email: string;
  name?: string | null;
}) {
  const email = normalizeEmail(options.email);
  const account = await getGoogleAccountForUser(options.userId);
  const existing = await prisma.emailAccount.findFirst({
    where: {
      organizationId: options.organizationId,
      email,
    },
  });

  const data = {
    name: options.name || email,
    email,
    gmailAccessToken: account?.access_token ?? null,
    gmailRefreshToken: account?.refresh_token ?? null,
    gmailExpiresAt: accountExpiryDate(account),
  };

  if (existing) {
    return prisma.emailAccount.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.emailAccount.create({
    data: {
      organizationId: options.organizationId,
      ...data,
    },
  });
}

export async function ensurePersonalWorkspaceForUser(options: {
  userId: string;
  email: string;
  name?: string | null;
  image?: string | null;
}) {
  const email = normalizeEmail(options.email);
  const existingMembership = await prisma.membership.findFirst({
    where: {
      userId: options.userId,
      organization: {
        emailAccounts: {
          some: { email },
        },
      },
    },
    include: { organization: true },
  });

  if (existingMembership) {
    await upsertWorkspaceEmailAccount({
      organizationId: existingMembership.organizationId,
      userId: options.userId,
      email,
      name: options.name,
    });
    return existingMembership.organization;
  }

  const organization = await prisma.organization.create({
    data: {
      name: getPersonalWorkspaceName({ name: options.name, email }),
      image: options.image,
      membership: {
        create: {
          userId: options.userId,
          role: MembershipRole.OWNER,
        },
      },
    },
  });

  await upsertWorkspaceEmailAccount({
    organizationId: organization.id,
    userId: options.userId,
    email,
    name: options.name,
  });

  return organization;
}

export async function createWorkspaceForUser(options: {
  userId: string;
  email: string;
  userName?: string | null;
  name: string;
  image?: string | null;
}) {
  const organization = await prisma.organization.create({
    data: {
      name: options.name,
      image: options.image,
      membership: {
        create: {
          userId: options.userId,
          role: MembershipRole.OWNER,
        },
      },
    },
  });

  await upsertWorkspaceEmailAccount({
    organizationId: organization.id,
    userId: options.userId,
    email: options.email,
    name: options.userName,
  });

  return getWorkspaceMembership({
    userId: options.userId,
    workspaceId: organization.id,
  });
}

export async function getWorkspaceMembership(options: {
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
          membership: {
            orderBy: { id: "asc" },
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
        },
      },
    },
  });
}

export function serializeWorkspace(
  membership: Awaited<ReturnType<typeof getWorkspaceMembership>>,
): WorkspaceSummary {
  if (!membership) throw new Error("Workspace not found");

  return {
    id: membership.organization.id,
    name: membership.organization.name,
    image: membership.organization.image,
    role: membership.role,
    emailAccounts: membership.organization.emailAccounts.map((account) => ({
      id: account.id,
      name: account.name,
      email: account.email,
    })),
    members: membership.organization.membership.map((member) => ({
      id: member.id,
      role: member.role,
      invitedEmail: member.invitedEmail,
      invitedName: member.invitedName,
      user: member.user
        ? {
            id: member.user.id,
            name: member.user.name,
            email: member.user.email,
            image: member.user.image,
          }
        : null,
    })),
  };
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
          },
          membership: {
            orderBy: { id: "asc" },
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
        },
      },
    },
  });

  return memberships.map((membership) => serializeWorkspace(membership));
}

export async function assertWorkspaceRole(options: {
  userId: string;
  workspaceId: string;
  roles?: MembershipRole[];
}) {
  const membership = await getWorkspaceMembership(options);
  if (!membership) throw new Error("Workspace not found");

  if (options.roles && !options.roles.includes(membership.role)) {
    throw new Error("Missing workspace permission");
  }

  return membership;
}

export async function updateWorkspaceForUser(options: {
  userId: string;
  workspaceId: string;
  name?: string;
  image?: string | null;
}) {
  await assertWorkspaceRole({
    userId: options.userId,
    workspaceId: options.workspaceId,
    roles: [MembershipRole.OWNER, MembershipRole.ADMIN],
  });

  await prisma.organization.update({
    where: { id: options.workspaceId },
    data: {
      ...(options.name ? { name: options.name } : {}),
      ...(options.image !== undefined ? { image: options.image } : {}),
    },
  });

  return getWorkspaceMembership({
    userId: options.userId,
    workspaceId: options.workspaceId,
  });
}

export async function inviteWorkspaceMember(options: {
  workspaceId: string;
  inviterUserId: string;
  inviterEmail: string;
  invitedEmail: string;
  invitedName?: string | null;
  role: MembershipRole;
}) {
  await assertWorkspaceRole({
    userId: options.inviterUserId,
    workspaceId: options.workspaceId,
    roles: [MembershipRole.OWNER, MembershipRole.ADMIN],
  });

  const invitedEmail = normalizeEmail(options.invitedEmail);
  const inviterEmail = normalizeEmail(options.inviterEmail);
  if (invitedEmail === inviterEmail) {
    throw new Error("You are already a member of this workspace");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: invitedEmail },
    select: { id: true },
  });

  if (existingUser) {
    const existingMembership = await prisma.membership.findFirst({
      where: {
        organizationId: options.workspaceId,
        userId: existingUser.id,
      },
    });

    if (existingMembership) {
      return prisma.membership.update({
        where: { id: existingMembership.id },
        data: { role: options.role },
      });
    }
  }

  return prisma.membership.upsert({
    where: {
      organizationId_invitedEmail: {
        organizationId: options.workspaceId,
        invitedEmail,
      },
    },
    create: {
      organizationId: options.workspaceId,
      invitedEmail,
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
  name?: string | null;
}) {
  const email = normalizeEmail(options.email);
  const invitation = await prisma.membership.findUnique({
    where: { id: options.invitationId },
  });

  if (!invitation?.invitedEmail) throw new Error("Invitation not found");

  if (normalizeEmail(invitation.invitedEmail) !== email) {
    throw new Error("Invitation belongs to a different email address");
  }

  const existingMembership = await prisma.membership.findFirst({
    where: {
      organizationId: invitation.organizationId,
      userId: options.userId,
    },
  });

  if (existingMembership) {
    await prisma.membership.delete({ where: { id: invitation.id } });
    await upsertWorkspaceEmailAccount({
      organizationId: existingMembership.organizationId,
      userId: options.userId,
      email,
      name: options.name,
    });
    return existingMembership;
  }

  const membership = await prisma.membership.update({
    where: { id: invitation.id },
    data: {
      userId: options.userId,
      invitedEmail: null,
      invitedName: null,
    },
  });

  await upsertWorkspaceEmailAccount({
    organizationId: membership.organizationId,
    userId: options.userId,
    email,
    name: options.name,
  });

  return membership;
}

export async function updateWorkspaceMemberRole(options: {
  userId: string;
  workspaceId: string;
  memberId: string;
  role: MembershipRole;
}) {
  await assertWorkspaceRole({
    userId: options.userId,
    workspaceId: options.workspaceId,
    roles: [MembershipRole.OWNER],
  });

  const member = await prisma.membership.findFirstOrThrow({
    where: {
      id: options.memberId,
      organizationId: options.workspaceId,
    },
  });

  if (
    member.role === MembershipRole.OWNER &&
    options.role !== MembershipRole.OWNER
  ) {
    const owners = await prisma.membership.count({
      where: {
        organizationId: options.workspaceId,
        role: MembershipRole.OWNER,
      },
    });
    if (owners <= 1) throw new Error("Workspace must keep at least one owner");
  }

  return prisma.membership.update({
    where: { id: member.id },
    data: { role: options.role },
  });
}

export async function removeWorkspaceMember(options: {
  userId: string;
  workspaceId: string;
  memberId: string;
}) {
  const actorMembership = await assertWorkspaceRole({
    userId: options.userId,
    workspaceId: options.workspaceId,
    roles: [MembershipRole.OWNER, MembershipRole.ADMIN],
  });

  const member = await prisma.membership.findFirstOrThrow({
    where: {
      id: options.memberId,
      organizationId: options.workspaceId,
    },
  });

  if (member.role === MembershipRole.OWNER) {
    if (actorMembership.role !== MembershipRole.OWNER) {
      throw new Error("Only owners can remove other owners");
    }

    const owners = await prisma.membership.count({
      where: {
        organizationId: options.workspaceId,
        role: MembershipRole.OWNER,
      },
    });
    if (owners <= 1) throw new Error("Workspace must keep at least one owner");
  }

  await prisma.membership.delete({ where: { id: member.id } });
  return { ok: true };
}

export async function addCurrentUserEmailAccount(options: {
  userId: string;
  workspaceId: string;
  email: string;
  name?: string | null;
}) {
  await assertWorkspaceRole({
    userId: options.userId,
    workspaceId: options.workspaceId,
    roles: [MembershipRole.OWNER, MembershipRole.ADMIN],
  });

  return upsertWorkspaceEmailAccount({
    organizationId: options.workspaceId,
    userId: options.userId,
    email: options.email,
    name: options.name,
  });
}

export async function removeWorkspaceEmailAccount(options: {
  userId: string;
  workspaceId: string;
  emailAccountId: string;
}) {
  await assertWorkspaceRole({
    userId: options.userId,
    workspaceId: options.workspaceId,
    roles: [MembershipRole.OWNER, MembershipRole.ADMIN],
  });

  const account = await prisma.emailAccount.findFirstOrThrow({
    where: {
      id: options.emailAccountId,
      organizationId: options.workspaceId,
    },
  });

  await prisma.emailAccount.delete({ where: { id: account.id } });
  return { ok: true };
}

export async function getWorkspaceEmailAccountForUser(options: {
  userId: string;
  workspaceId: string;
  emailAccountId?: string | null;
}) {
  const membership = await assertWorkspaceRole({
    userId: options.userId,
    workspaceId: options.workspaceId,
  });

  const emailAccount = options.emailAccountId
    ? membership.organization.emailAccounts.find(
        (account) => account.id === options.emailAccountId,
      )
    : membership.organization.emailAccounts[0];

  return { membership, emailAccount };
}
