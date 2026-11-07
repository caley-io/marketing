import prisma from "@/utils/prisma";
import {
  type WorkspaceEmailAccountRecord,
  type WorkspaceMemberRecord,
  type WorkspaceRecord,
  type WorkspaceRepository,
  type WorkspaceRole,
} from "@/utils/workspace";
import { type MembershipRole } from "@prisma/client";

// Maps application-level workspace roles onto Prisma MembershipRole enum values
// while preserving compatibility with existing database migrations.
function toPrismaMembershipRole(role: WorkspaceRole): MembershipRole {
  if (role === "OWNER") return "OWNER";
  if (role === "ADMIN") return "ADMIN";
  return "USER";
}

function fromPrismaMembershipRole(role: MembershipRole): WorkspaceRole {
  if (role === "OWNER") return "OWNER";
  if (role === "ADMIN") return "ADMIN";
  return "MEMBER";
}

function mapWorkspaceRecord(org: {
  id: string;
  name: string;
  image: string | null;
  membership: {
    id: string;
    organizationId: string;
    userId: string | null;
    role: MembershipRole;
    invitedEmail: string | null;
    invitedName: string | null;
  }[];
  emailAccounts: {
    id: string;
    organizationId: string;
    name: string;
    email: string;
    gmailAccessToken: string | null;
    gmailRefreshToken: string | null;
    gmailExpiresAt: Date | null;
  }[];
}): WorkspaceRecord {
  return {
    id: org.id,
    name: org.name,
    image: org.image,
    membership: org.membership.map((m) => ({
      id: m.id,
      organizationId: m.organizationId,
      userId: m.userId,
      role: fromPrismaMembershipRole(m.role),
      invitedEmail: m.invitedEmail,
      invitedName: m.invitedName,
    })),
    emailAccounts: org.emailAccounts.map((acc) => ({
      id: acc.id,
      organizationId: acc.organizationId,
      name: acc.name,
      email: acc.email,
      gmailAccessToken: acc.gmailAccessToken,
      gmailRefreshToken: acc.gmailRefreshToken,
      gmailExpiresAt: acc.gmailExpiresAt,
    })),
  };
}

// Prisma-backed persistence adapter implementing multitenant workspace queries
// and atomic membership mutations.
export const prismaWorkspaceRepository: WorkspaceRepository = {
  async createOrganization(input): Promise<WorkspaceRecord> {
    const created = await prisma.organization.create({
      data: {
        name: input.name,
        image: input.image ?? null,
        membership: {
          create: {
            userId: input.ownerUserId,
            role: "OWNER",
          },
        },
      },
      include: {
        membership: true,
        emailAccounts: true,
      },
    });
    return mapWorkspaceRecord(created);
  },

  async findWorkspaceById(workspaceId: string): Promise<WorkspaceRecord | null> {
    const found = await prisma.organization.findUnique({
      where: { id: workspaceId },
      include: {
        membership: true,
        emailAccounts: true,
      },
    });
    if (!found) return null;
    return mapWorkspaceRecord(found);
  },

  async listUserWorkspaces(userId: string): Promise<WorkspaceRecord[]> {
    const orgs = await prisma.organization.findMany({
      where: {
        membership: {
          some: { userId },
        },
      },
      include: {
        membership: true,
        emailAccounts: true,
      },
    });
    return orgs.map(mapWorkspaceRecord);
  },

  async upsertMemberInvitation(input): Promise<WorkspaceMemberRecord> {
    const prismaRole = toPrismaMembershipRole(input.role);
    const record = await prisma.membership.upsert({
      where: {
        organizationId_invitedEmail: {
          organizationId: input.workspaceId,
          invitedEmail: input.invitedEmail,
        },
      },
      create: {
        organizationId: input.workspaceId,
        invitedEmail: input.invitedEmail,
        invitedName: input.invitedName ?? null,
        role: prismaRole,
      },
      update: {
        invitedName: input.invitedName ?? null,
        role: prismaRole,
      },
    });
    return {
      id: record.id,
      organizationId: record.organizationId,
      userId: record.userId,
      role: input.role,
      invitedEmail: record.invitedEmail,
      invitedName: record.invitedName,
      inviteToken: input.inviteToken,
    };
  },

  async bindInvitationToUser(input): Promise<WorkspaceMemberRecord> {
    const record = await prisma.membership.update({
      where: {
        organizationId_invitedEmail: {
          organizationId: input.workspaceId,
          invitedEmail: input.invitedEmail,
        },
      },
      data: {
        userId: input.userId,
        invitedEmail: null,
        invitedName: null,
      },
    });
    return {
      id: record.id,
      organizationId: record.organizationId,
      userId: record.userId,
      role: fromPrismaMembershipRole(record.role),
      invitedEmail: record.invitedEmail,
      invitedName: record.invitedName,
    };
  },

  async updateMembershipRole(input): Promise<WorkspaceMemberRecord> {
    const prismaRole = toPrismaMembershipRole(input.role);
    const record = await prisma.membership.update({
      where: { id: input.membershipId },
      data: { role: prismaRole },
    });
    return {
      id: record.id,
      organizationId: record.organizationId,
      userId: record.userId,
      role: input.role,
      invitedEmail: record.invitedEmail,
      invitedName: record.invitedName,
    };
  },

  async createEmailAccount(input): Promise<WorkspaceEmailAccountRecord> {
    const created = await prisma.emailAccount.create({
      data: {
        organizationId: input.workspaceId,
        name: input.name,
        email: input.email,
        gmailAccessToken: input.gmailAccessToken ?? null,
        gmailRefreshToken: input.gmailRefreshToken ?? null,
        gmailExpiresAt: input.gmailExpiresAt ?? null,
      },
    });
    return {
      id: created.id,
      organizationId: created.organizationId,
      name: created.name,
      email: created.email,
      provider: input.provider,
      gmailAccessToken: created.gmailAccessToken,
      gmailRefreshToken: created.gmailRefreshToken,
      gmailExpiresAt: created.gmailExpiresAt,
    };
  },

  async deleteEmailAccount(input): Promise<void> {
    await prisma.emailAccount.deleteMany({
      where: {
        id: input.accountId,
        organizationId: input.workspaceId,
      },
    });
  },
};
