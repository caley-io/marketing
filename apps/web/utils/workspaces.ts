import { z } from "zod";

export const WORKSPACE_ROLES = ["OWNER", "ADMIN", "USER"] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export const createWorkspaceBody = z.object({
  name: z.string().trim().min(1, "Workspace name is required").max(80),
  image: z.string().trim().url().optional().or(z.literal("")),
  invites: z
    .array(
      z.object({
        email: z.string().trim().email(),
        name: z.string().trim().max(80).optional(),
        role: z.enum(WORKSPACE_ROLES).default("USER"),
      }),
    )
    .optional(),
  emailAccounts: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        email: z.string().trim().email(),
      }),
    )
    .optional(),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceBody>;

export const inviteMemberBody = z.object({
  email: z.string().trim().email("Valid email address is required"),
  name: z.string().trim().max(80).optional(),
  role: z.enum(WORKSPACE_ROLES).default("USER"),
});

export type InviteMemberInput = z.infer<typeof inviteMemberBody>;

export const updateMemberRoleBody = z.object({
  membershipId: z.string().trim().min(1),
  role: z.enum(WORKSPACE_ROLES),
});

export const addEmailAccountBody = z.object({
  name: z.string().trim().min(1, "Account label is required").max(80),
  email: z.string().trim().email("Valid Gmail or Google Workspace email is required"),
  gmailAccessToken: z.string().optional(),
  gmailRefreshToken: z.string().optional(),
  gmailExpiresAt: z.string().datetime().optional(),
});

export type AddEmailAccountInput = z.infer<typeof addEmailAccountBody>;

export interface WorkspaceUserIdentity {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export function canManageWorkspaceMembers(role?: WorkspaceRole | null): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export function getWorkspaceInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "WS";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

/**
 * Claims any pending email invitations matching the user's email address and
 * ensures the user has at least one personal workspace with their primary email account.
 */
export async function ensurePersonalWorkspace(
  db: any,
  user: WorkspaceUserIdentity,
) {
  const normalizedEmail = user.email?.trim().toLowerCase();

  if (normalizedEmail) {
    const pendingInvites = await db.membership.findMany({
      where: {
        invitedEmail: normalizedEmail,
        userId: null,
      },
    });

    for (const invite of pendingInvites) {
      await db.membership.update({
        where: { id: invite.id },
        data: {
          userId: user.id,
          invitedEmail: null,
          invitedName: null,
        },
      });
    }
  }

  const existingMemberships = await db.membership.findMany({
    where: { userId: user.id },
    include: {
      organization: {
        include: {
          membership: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
          emailAccounts: true,
        },
      },
    },
  });

  if (existingMemberships.length > 0) {
    return existingMemberships.map((m: any) => m.organization);
  }

  const personalWorkspaceName = user.name?.trim()
    ? `${user.name.trim()}'s Workspace`
    : "Personal Workspace";

  const created = await db.organization.create({
    data: {
      name: personalWorkspaceName,
      image: user.image || null,
      membership: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
      ...(normalizedEmail
        ? {
            emailAccounts: {
              create: {
                name: user.name?.trim() || normalizedEmail.split("@")[0],
                email: normalizedEmail,
              },
            },
          }
        : {}),
    },
    include: {
      membership: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
      emailAccounts: true,
    },
  });

  return [created];
}

export async function listUserWorkspaces(db: any, user: WorkspaceUserIdentity) {
  await ensurePersonalWorkspace(db, user);

  return await db.organization.findMany({
    where: {
      membership: {
        some: {
          userId: user.id,
        },
      },
    },
    include: {
      membership: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
      emailAccounts: true,
    },
  });
}

export async function createWorkspace(
  db: any,
  user: WorkspaceUserIdentity,
  rawInput: CreateWorkspaceInput,
) {
  const input = createWorkspaceBody.parse(rawInput);
  const creatorEmail = user.email?.trim().toLowerCase();

  const dedupedInvites = (input.invites ?? []).filter((invite) => {
    const email = invite.email.trim().toLowerCase();
    return email && email !== creatorEmail;
  });

  const initialAccounts =
    input.emailAccounts && input.emailAccounts.length > 0
      ? input.emailAccounts.map((acc) => ({
          name: acc.name.trim(),
          email: acc.email.trim().toLowerCase(),
        }))
      : creatorEmail
        ? [
            {
              name: user.name?.trim() || creatorEmail.split("@")[0],
              email: creatorEmail,
            },
          ]
        : [];

  return await db.organization.create({
    data: {
      name: input.name,
      image: input.image || null,
      membership: {
        create: [
          {
            userId: user.id,
            role: "OWNER",
          },
          ...dedupedInvites.map((invite) => ({
            role: invite.role,
            invitedEmail: invite.email.trim().toLowerCase(),
            invitedName: invite.name?.trim() || null,
          })),
        ],
      },
      ...(initialAccounts.length > 0
        ? {
            emailAccounts: {
              create: initialAccounts,
            },
          }
        : {}),
    },
    include: {
      membership: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
      emailAccounts: true,
    },
  });
}

export async function getActorMembership(
  db: any,
  userId: string,
  organizationId: string,
) {
  return await db.membership.findFirst({
    where: {
      organizationId,
      userId,
    },
  });
}

export async function inviteWorkspaceMember(
  db: any,
  actorUserId: string,
  organizationId: string,
  rawInput: InviteMemberInput,
) {
  const actorMembership = await getActorMembership(
    db,
    actorUserId,
    organizationId,
  );
  if (!actorMembership || !canManageWorkspaceMembers(actorMembership.role)) {
    throw new Error("Only workspace owners or admins can invite members.");
  }

  const input = inviteMemberBody.parse(rawInput);
  const normalizedEmail = input.email.trim().toLowerCase();

  if (input.role === "OWNER" && actorMembership.role !== "OWNER") {
    throw new Error("Only workspace owners can assign the OWNER role.");
  }

  const existingUser = await db.user?.findUnique?.({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    const existingMember = await db.membership.findFirst({
      where: {
        organizationId,
        userId: existingUser.id,
      },
    });

    if (existingMember) {
      throw new Error("User is already a member of this workspace.");
    }

    return await db.membership.create({
      data: {
        organizationId,
        userId: existingUser.id,
        role: input.role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });
  }

  const existingInvite = await db.membership.findFirst({
    where: {
      organizationId,
      invitedEmail: normalizedEmail,
    },
  });

  if (existingInvite) {
    return await db.membership.update({
      where: { id: existingInvite.id },
      data: {
        role: input.role,
        invitedName: input.name?.trim() || existingInvite.invitedName || null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });
  }

  return await db.membership.create({
    data: {
      organizationId,
      role: input.role,
      invitedEmail: normalizedEmail,
      invitedName: input.name?.trim() || null,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });
}

export async function updateWorkspaceMemberRole(
  db: any,
  actorUserId: string,
  organizationId: string,
  membershipId: string,
  newRole: WorkspaceRole,
) {
  const actorMembership = await getActorMembership(
    db,
    actorUserId,
    organizationId,
  );
  if (!actorMembership || !canManageWorkspaceMembers(actorMembership.role)) {
    throw new Error("Only workspace owners or admins can update member roles.");
  }

  const targetMembership = await db.membership.findFirst({
    where: { id: membershipId, organizationId },
  });
  if (!targetMembership) {
    throw new Error("Workspace membership not found.");
  }

  if (
    (targetMembership.role === "OWNER" || newRole === "OWNER") &&
    actorMembership.role !== "OWNER"
  ) {
    throw new Error("Only workspace owners can modify OWNER roles.");
  }

  if (targetMembership.role === "OWNER" && newRole !== "OWNER") {
    const ownersCount = await db.membership.count({
      where: { organizationId, role: "OWNER" },
    });
    if (ownersCount <= 1) {
      throw new Error("Workspace must have at least one owner.");
    }
  }

  return await db.membership.update({
    where: { id: membershipId },
    data: { role: newRole },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });
}

export async function removeWorkspaceMember(
  db: any,
  actorUserId: string,
  organizationId: string,
  membershipId: string,
) {
  const actorMembership = await getActorMembership(
    db,
    actorUserId,
    organizationId,
  );
  if (!actorMembership || !canManageWorkspaceMembers(actorMembership.role)) {
    throw new Error("Only workspace owners or admins can remove members.");
  }

  const targetMembership = await db.membership.findFirst({
    where: { id: membershipId, organizationId },
  });
  if (!targetMembership) {
    throw new Error("Workspace membership not found.");
  }

  if (targetMembership.role === "OWNER") {
    if (actorMembership.role !== "OWNER") {
      throw new Error("Admins cannot remove a workspace owner.");
    }
    const ownersCount = await db.membership.count({
      where: { organizationId, role: "OWNER" },
    });
    if (ownersCount <= 1) {
      throw new Error("Cannot remove the last owner of a workspace.");
    }
  }

  return await db.membership.delete({
    where: { id: membershipId },
  });
}

export async function addWorkspaceEmailAccount(
  db: any,
  actorUserId: string,
  organizationId: string,
  rawInput: AddEmailAccountInput,
) {
  const actorMembership = await getActorMembership(
    db,
    actorUserId,
    organizationId,
  );
  if (!actorMembership) {
    throw new Error("Not a member of this workspace.");
  }

  const input = addEmailAccountBody.parse(rawInput);
  const normalizedEmail = input.email.trim().toLowerCase();

  const existingAccount = await db.emailAccount.findFirst({
    where: {
      organizationId,
      email: normalizedEmail,
    },
  });

  if (existingAccount) {
    return await db.emailAccount.update({
      where: { id: existingAccount.id },
      data: {
        name: input.name.trim(),
        ...(input.gmailAccessToken
          ? { gmailAccessToken: input.gmailAccessToken }
          : {}),
        ...(input.gmailRefreshToken
          ? { gmailRefreshToken: input.gmailRefreshToken }
          : {}),
        ...(input.gmailExpiresAt
          ? { gmailExpiresAt: new Date(input.gmailExpiresAt) }
          : {}),
      },
    });
  }

  return await db.emailAccount.create({
    data: {
      organizationId,
      name: input.name.trim(),
      email: normalizedEmail,
      gmailAccessToken: input.gmailAccessToken || null,
      gmailRefreshToken: input.gmailRefreshToken || null,
      gmailExpiresAt: input.gmailExpiresAt
        ? new Date(input.gmailExpiresAt)
        : null,
    },
  });
}

export async function removeWorkspaceEmailAccount(
  db: any,
  actorUserId: string,
  organizationId: string,
  accountId: string,
) {
  const actorMembership = await getActorMembership(
    db,
    actorUserId,
    organizationId,
  );
  if (!actorMembership || !canManageWorkspaceMembers(actorMembership.role)) {
    throw new Error(
      "Only workspace owners or admins can remove email accounts.",
    );
  }

  const targetAccount = await db.emailAccount.findFirst({
    where: { id: accountId, organizationId },
  });
  if (!targetAccount) {
    throw new Error("Email account not found in this workspace.");
  }

  return await db.emailAccount.delete({
    where: { id: accountId },
  });
}
