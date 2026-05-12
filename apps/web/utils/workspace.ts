import { MembershipRole } from "@prisma/client";

import prisma from "@/utils/prisma";

export interface WorkspaceMemberSummary {
  id: string;
  role: MembershipRole;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  invited: boolean;
}

export interface WorkspaceEmailAccountSummary {
  id: string;
  email: string;
  name: string;
}

export interface WorkspaceEmailAccountAccess
  extends WorkspaceEmailAccountSummary {
  gmailAccessToken?: string | null;
  gmailRefreshToken?: string | null;
  gmailExpiresAt?: Date | null;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  image?: string | null;
  role: MembershipRole;
  members: WorkspaceMemberSummary[];
  emailAccounts: WorkspaceEmailAccountSummary[];
}

type WorkspaceMembershipRow = {
  role: MembershipRole;
  organization: {
    id: string;
    name: string;
    image?: string | null;
    emailAccounts: WorkspaceEmailAccountSummary[];
    membership: {
      id: string;
      role: MembershipRole;
      invitedEmail?: string | null;
      invitedName?: string | null;
      user?: {
        id: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
      } | null;
    }[];
  };
};

function personalWorkspaceName(user: {
  name?: string | null;
  email?: string | null;
}) {
  if (user.name) return `${user.name}'s Workspace`;
  if (user.email) return `${user.email.split("@")[0]}'s Workspace`;
  return "Personal Workspace";
}

export async function ensurePersonalWorkspaceForUser(user: {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}) {
  const existingMembership = await prisma.membership.findFirst({
    where: { userId: user.id },
    select: { organizationId: true },
  });

  if (existingMembership) {
    await ensureWorkspaceEmailAccount({
      organizationId: existingMembership.organizationId,
      email: user.email,
      name: user.name,
      userId: user.id,
    });
    return existingMembership.organizationId;
  }

  const organization = await prisma.organization.create({
    data: {
      name: personalWorkspaceName(user),
      image: user.image,
      membership: {
        create: {
          role: MembershipRole.OWNER,
          userId: user.id,
        },
      },
    },
    select: { id: true },
  });

  await ensureWorkspaceEmailAccount({
    organizationId: organization.id,
    email: user.email,
    name: user.name,
    userId: user.id,
  });

  return organization.id;
}

export async function getWorkspacesForUser(
  userId: string,
): Promise<WorkspaceSummary[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  if (user) await ensurePersonalWorkspaceForUser(user);

  const memberships = (await prisma.membership.findMany({
    where: { userId },
    orderBy: { organization: { name: "asc" } },
    select: {
      role: true,
      organization: {
        select: {
          id: true,
          name: true,
          image: true,
          emailAccounts: {
            select: {
              id: true,
              email: true,
              name: true,
            },
            orderBy: { email: "asc" },
          },
          membership: {
            select: {
              id: true,
              role: true,
              invitedEmail: true,
              invitedName: true,
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
  })) as WorkspaceMembershipRow[];

  return memberships.map(({ role, organization }) => ({
    id: organization.id,
    name: organization.name,
    image: organization.image,
    role,
    members: organization.membership.map((member) => ({
      id: member.id,
      role: member.role,
      name: member.user?.name ?? member.invitedName,
      email: member.user?.email ?? member.invitedEmail,
      image: member.user?.image,
      invited: !member.user,
    })),
    emailAccounts: organization.emailAccounts,
  }));
}

export async function createWorkspaceForUser(options: {
  userId: string;
  name: string;
  image?: string | null;
  email?: string | null;
  userName?: string | null;
}) {
  const organization = await prisma.organization.create({
    data: {
      name: options.name,
      image: options.image,
      membership: {
        create: {
          role: MembershipRole.OWNER,
          userId: options.userId,
        },
      },
    },
    select: { id: true },
  });

  await ensureWorkspaceEmailAccount({
    organizationId: organization.id,
    email: options.email,
    name: options.userName,
    userId: options.userId,
  });

  return organization.id;
}

export async function canManageWorkspace(options: {
  userId: string;
  organizationId: string;
}) {
  const membership = await prisma.membership.findFirst({
    where: {
      userId: options.userId,
      organizationId: options.organizationId,
      role: { in: [MembershipRole.OWNER, MembershipRole.ADMIN] },
    },
    select: { id: true },
  });

  return Boolean(membership);
}

export async function canAccessWorkspace(options: {
  userId: string;
  organizationId: string;
}) {
  const membership = await prisma.membership.findFirst({
    where: {
      userId: options.userId,
      organizationId: options.organizationId,
    },
    select: { id: true },
  });

  return Boolean(membership);
}

export async function getWorkspaceEmailAccountsForUser(options: {
  userId: string;
  organizationId: string;
}): Promise<WorkspaceEmailAccountAccess[] | null> {
  const canAccess = await canAccessWorkspace(options);
  if (!canAccess) return null;

  return prisma.emailAccount.findMany({
    where: { organizationId: options.organizationId },
    select: {
      id: true,
      email: true,
      name: true,
      gmailAccessToken: true,
      gmailRefreshToken: true,
      gmailExpiresAt: true,
    },
    orderBy: { email: "asc" },
  }) as Promise<WorkspaceEmailAccountAccess[]>;
}

async function ensureWorkspaceEmailAccount(options: {
  organizationId: string;
  email?: string | null;
  name?: string | null;
  userId?: string | null;
}) {
  if (!options.email) return;

  const googleAccount = options.userId
    ? await prisma.account.findFirst({
        where: { userId: options.userId, provider: "google" },
        select: {
          access_token: true,
          refresh_token: true,
          expires_at: true,
        },
      })
    : null;
  const tokenData = {
    ...(googleAccount?.access_token
      ? { gmailAccessToken: googleAccount.access_token }
      : {}),
    ...(googleAccount?.refresh_token
      ? { gmailRefreshToken: googleAccount.refresh_token }
      : {}),
    ...(googleAccount?.expires_at
      ? { gmailExpiresAt: new Date(googleAccount.expires_at * 1000) }
      : {}),
  };

  const existingEmailAccount = await prisma.emailAccount.findFirst({
    where: {
      organizationId: options.organizationId,
      email: options.email,
    },
    select: { id: true },
  });

  if (existingEmailAccount) {
    await prisma.emailAccount.update({
      where: { id: existingEmailAccount.id },
      data: {
        name: options.name ?? options.email,
        ...tokenData,
      },
    });
    return;
  }

  await prisma.emailAccount.create({
    data: {
      organizationId: options.organizationId,
      email: options.email,
      name: options.name ?? options.email,
      ...tokenData,
    },
  });
}
