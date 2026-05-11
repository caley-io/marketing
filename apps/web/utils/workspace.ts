import { MembershipRole } from "@prisma/client";

import prisma from "@/utils/prisma";

export type WorkspaceSummary = Awaited<
  ReturnType<typeof getWorkspacesForUser>
>[number];

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

  if (existingMembership) return existingMembership.organizationId;

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

  return organization.id;
}

export async function getWorkspacesForUser(userId: string) {
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

  const memberships = await prisma.membership.findMany({
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
  });

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
