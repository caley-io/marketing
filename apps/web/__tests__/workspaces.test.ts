import { describe, expect, test } from "@jest/globals";
import { InMemoryWorkspaceStore } from "../utils/workspaces/workspace-service";

describe("Multitenancy & Workspaces/Teams Service (#1)", () => {
  test("creates personal and team workspaces, invites members with roles, and links multiple Gmail/Google Workspace accounts", () => {
    const store = new InMemoryWorkspaceStore();

    // 1. Create Personal Workspace and Team Workspace
    const personal = store.createWorkspace({
      name: "Personal Inbox Workspace",
      ownerUserId: "user_founder",
    });
    const team = store.createWorkspace({
      name: "Caley Engineering Team",
      ownerUserId: "user_founder",
    });

    expect(personal.ownerMembership.role).toBe("OWNER");
    expect(team.ownerMembership.role).toBe("OWNER");

    // 2. Invite team members with ADMIN and USER roles
    const adminInvite = store.inviteTeamMember({
      organizationId: team.workspace.id,
      actorUserId: "user_founder",
      invitedEmail: "Admin@Caley.io",
      invitedName: "Alice Admin",
      role: "ADMIN",
    });
    expect(adminInvite.invitedEmail).toBe("admin@caley.io");
    expect(adminInvite.role).toBe("ADMIN");

    // 3. Accept invitation: sets userId and clears invitedEmail & invitedName
    const accepted = store.acceptInvitation({
      organizationId: team.workspace.id,
      invitedEmail: "admin@caley.io",
      userId: "user_alice",
    });
    expect(accepted.userId).toBe("user_alice");
    expect(accepted.invitedEmail).toBeNull();
    expect(accepted.invitedName).toBeNull();

    // 4. Add multiple Gmail and Google Workspace accounts to the same workspace
    const acct1 = store.addEmailAccountToWorkspace({
      organizationId: team.workspace.id,
      actorUserId: "user_founder",
      name: "Founder Gmail",
      email: "founder@gmail.com",
      provider: "GMAIL",
    });
    const acct2 = store.addEmailAccountToWorkspace({
      organizationId: team.workspace.id,
      actorUserId: "user_alice",
      name: "Support Google Workspace",
      email: "support@caley.io",
      provider: "GOOGLE_WORKSPACE",
    });

    expect(acct1.organizationId).toBe(team.workspace.id);
    expect(acct2.organizationId).toBe(team.workspace.id);

    const founderWorkspaces = store.listUserWorkspaces("user_founder");
    expect(founderWorkspaces).toHaveLength(2);
    const teamSummary = founderWorkspaces.find((w) => w.workspace.id === team.workspace.id)!;
    expect(teamSummary.emailAccounts).toHaveLength(2);
  });
});
