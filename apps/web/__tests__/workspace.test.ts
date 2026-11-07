import {
  acceptWorkspaceInvitation,
  addWorkspaceEmailAccount,
  createWorkspace,
  hasRequiredRole,
  inviteWorkspaceMember,
  removeWorkspaceEmailAccount,
  type InvitationMailPayload,
  type WorkspaceEmailAccountRecord,
  type WorkspaceMemberRecord,
  type WorkspaceRecord,
  type WorkspaceRepository,
} from "@/utils/workspace";

// Builds an isolated in-memory workspace repository to verify multitenant
// domain invariants without external database side effects.
function createInMemoryWorkspaceRepository(): WorkspaceRepository {
  const workspaces = new Map<string, WorkspaceRecord>();
  let idCounter = 1;

  const nextId = (prefix: string) => `${prefix}_${idCounter++}`;

  return {
    async createOrganization(input): Promise<WorkspaceRecord> {
      const id = nextId("org");
      const ownerMember: WorkspaceMemberRecord = {
        id: nextId("mem"),
        organizationId: id,
        userId: input.ownerUserId,
        role: "OWNER",
        invitedEmail: null,
        invitedName: null,
      };
      const record: WorkspaceRecord = {
        id,
        name: input.name,
        description: input.description ?? null,
        image: input.image ?? null,
        membership: [ownerMember],
        emailAccounts: [],
      };
      workspaces.set(id, record);
      return record;
    },

    async findWorkspaceById(workspaceId): Promise<WorkspaceRecord | null> {
      return workspaces.get(workspaceId) ?? null;
    },

    async listUserWorkspaces(userId): Promise<WorkspaceRecord[]> {
      return Array.from(workspaces.values()).filter((ws) =>
        ws.membership.some((m) => m.userId === userId),
      );
    },

    async upsertMemberInvitation(input): Promise<WorkspaceMemberRecord> {
      const ws = workspaces.get(input.workspaceId);
      if (!ws) throw new Error("Workspace missing");

      const existing = ws.membership.find(
        (m) => m.invitedEmail === input.invitedEmail,
      );
      if (existing) {
        existing.role = input.role;
        existing.invitedName = input.invitedName ?? null;
        existing.inviteToken = input.inviteToken;
        return existing;
      }

      const created: WorkspaceMemberRecord = {
        id: nextId("mem"),
        organizationId: input.workspaceId,
        userId: null,
        role: input.role,
        invitedEmail: input.invitedEmail,
        invitedName: input.invitedName ?? null,
        inviteToken: input.inviteToken,
      };
      ws.membership.push(created);
      return created;
    },

    async bindInvitationToUser(input): Promise<WorkspaceMemberRecord> {
      const ws = workspaces.get(input.workspaceId);
      if (!ws) throw new Error("Workspace missing");

      const invite = ws.membership.find(
        (m) => m.invitedEmail === input.invitedEmail,
      );
      if (!invite) throw new Error("Invitation missing");

      invite.userId = input.userId;
      invite.invitedEmail = null;
      invite.invitedName = null;
      return invite;
    },

    async updateMembershipRole(input): Promise<WorkspaceMemberRecord> {
      for (const ws of workspaces.values()) {
        const member = ws.membership.find((m) => m.id === input.membershipId);
        if (member) {
          member.role = input.role;
          return member;
        }
      }
      throw new Error("Membership missing");
    },

    async createEmailAccount(input): Promise<WorkspaceEmailAccountRecord> {
      const ws = workspaces.get(input.workspaceId);
      if (!ws) throw new Error("Workspace missing");

      const account: WorkspaceEmailAccountRecord = {
        id: nextId("acc"),
        organizationId: input.workspaceId,
        name: input.name,
        email: input.email,
        provider: input.provider,
        gmailAccessToken: input.gmailAccessToken ?? null,
        gmailRefreshToken: input.gmailRefreshToken ?? null,
        gmailExpiresAt: input.gmailExpiresAt ?? null,
      };
      ws.emailAccounts.push(account);
      return account;
    },

    async deleteEmailAccount(input): Promise<void> {
      const ws = workspaces.get(input.workspaceId);
      if (!ws) return;
      ws.emailAccounts = ws.emailAccounts.filter(
        (acc) => acc.id !== input.accountId,
      );
    },
  };
}

describe("Workspace Multitenancy and Teams Service", () => {
  it("creates separate personal and company workspaces with OWNER membership", async () => {
    const repo = createInMemoryWorkspaceRepository();

    const personal = await createWorkspace(repo, {
      actorUserId: "user_founder",
      name: "Personal Inbox",
      description: "All personal Gmail addresses",
    });
    const company = await createWorkspace(repo, {
      actorUserId: "user_founder",
      name: "Caley Engineering",
      description: "Team support and engineering inboxes",
    });

    expect(personal.id).not.toEqual(company.id);
    expect(personal.membership[0].role).toBe("OWNER");
    expect(company.membership[0].userId).toBe("user_founder");

    const listed = await repo.listUserWorkspaces("user_founder");
    expect(listed).toHaveLength(2);
  });

  it("invites team members with assigned roles and dispatches email payload", async () => {
    const repo = createInMemoryWorkspaceRepository();
    const sentPayloads: InvitationMailPayload[] = [];

    const workspace = await createWorkspace(repo, {
      actorUserId: "user_owner",
      name: "Caley Marketing",
    });

    const invite = await inviteWorkspaceMember(repo, {
      actorUserId: "user_owner",
      workspaceId: workspace.id,
      invitedEmail: "Teammate@Caley.io",
      invitedName: "Alex Teammate",
      role: "ADMIN",
      sendInviteEmail: async (payload) => {
        sentPayloads.push(payload);
      },
    });

    expect(invite.invitedEmail).toBe("teammate@caley.io");
    expect(invite.role).toBe("ADMIN");
    expect(sentPayloads).toHaveLength(1);
    expect(sentPayloads[0].workspaceName).toBe("Caley Marketing");

    const bound = await acceptWorkspaceInvitation(repo, {
      workspaceId: workspace.id,
      userId: "user_alex",
      userEmail: "teammate@caley.io",
    });
    expect(bound.userId).toBe("user_alex");
    expect(bound.invitedEmail).toBeNull();
  });

  it("enforces RBAC hierarchy when non-admin members attempt privileged actions", async () => {
    const repo = createInMemoryWorkspaceRepository();
    const workspace = await createWorkspace(repo, {
      actorUserId: "user_owner",
      name: "Restricted Workspace",
    });

    await inviteWorkspaceMember(repo, {
      actorUserId: "user_owner",
      workspaceId: workspace.id,
      invitedEmail: "viewer@caley.io",
      role: "VIEWER",
    });
    await acceptWorkspaceInvitation(repo, {
      workspaceId: workspace.id,
      userId: "user_viewer",
      userEmail: "viewer@caley.io",
    });

    await expect(
      inviteWorkspaceMember(repo, {
        actorUserId: "user_viewer",
        workspaceId: workspace.id,
        invitedEmail: "rogue@caley.io",
        role: "MEMBER",
      }),
    ).rejects.toThrow("Insufficient workspace permissions");

    expect(hasRequiredRole("OWNER", "ADMIN")).toBe(true);
    expect(hasRequiredRole("VIEWER", "MEMBER")).toBe(false);
  });

  it("links multiple Gmail and Google Workspace accounts to a single workspace", async () => {
    const repo = createInMemoryWorkspaceRepository();
    const workspace = await createWorkspace(repo, {
      actorUserId: "user_owner",
      name: "Multi-Inbox Workspace",
    });

    const gmailAccount = await addWorkspaceEmailAccount(repo, {
      actorUserId: "user_owner",
      workspaceId: workspace.id,
      name: "Personal Gmail",
      email: "founder@gmail.com",
      provider: "gmail",
      gmailAccessToken: "ya29.personal",
    });

    const gsuiteAccount = await addWorkspaceEmailAccount(repo, {
      actorUserId: "user_owner",
      workspaceId: workspace.id,
      name: "Google Workspace Support",
      email: "support@caley.io",
      provider: "google_workspace",
      gmailAccessToken: "ya29.workspace",
    });

    expect(gmailAccount.email).toBe("founder@gmail.com");
    expect(gsuiteAccount.provider).toBe("google_workspace");

    await expect(
      addWorkspaceEmailAccount(repo, {
        actorUserId: "user_owner",
        workspaceId: workspace.id,
        name: "Duplicate Inbox",
        email: "SUPPORT@caley.io",
      }),
    ).rejects.toThrow("already linked");

    await removeWorkspaceEmailAccount(repo, {
      actorUserId: "user_owner",
      workspaceId: workspace.id,
      accountId: gmailAccount.id,
    });

    const reloaded = await repo.findWorkspaceById(workspace.id);
    expect(reloaded?.emailAccounts).toHaveLength(1);
    expect(reloaded?.emailAccounts[0].email).toBe("support@caley.io");
  });
});
