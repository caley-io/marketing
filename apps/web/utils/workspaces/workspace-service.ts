/**
 * Multitenancy & Teams/Workspaces Domain Service (caley-io/marketing#1).
 *
 * Implements Slack-style multi-workspace support over the Prisma models:
 * - `Organization` (workspace)
 * - `Membership` (`OWNER` | `ADMIN` | `USER`, pending email invitations)
 * - `EmailAccount` (multiple Gmail / Google Workspace / Outlook / Yahoo accounts per workspace)
 */

export type MembershipRole = "OWNER" | "ADMIN" | "USER";
export type EmailProvider = "GMAIL" | "GOOGLE_WORKSPACE" | "OUTLOOK" | "YAHOO";

export interface Workspace {
  id: string;
  name: string;
  image?: string | null;
}

export interface WorkspaceMembership {
  id: string;
  organizationId: string;
  userId?: string | null;
  role: MembershipRole;
  invitedName?: string | null;
  invitedEmail?: string | null;
}

export interface LinkedEmailAccount {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  provider: EmailProvider;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: Date | null;
}

export function normalizeEmail(email: string): string {
  const trimmed = (email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new Error(`Invalid email address: ${email}`);
  }
  return trimmed;
}

export function canManageMembers(actorRole: MembershipRole): boolean {
  return actorRole === "OWNER" || actorRole === "ADMIN";
}

export function canAssignRole(actorRole: MembershipRole, targetRole: MembershipRole): boolean {
  if (actorRole === "OWNER") return true;
  if (actorRole === "ADMIN") return targetRole !== "OWNER";
  return false;
}

export class InMemoryWorkspaceStore {
  public workspaces: Map<string, Workspace> = new Map();
  public memberships: WorkspaceMembership[] = [];
  public emailAccounts: LinkedEmailAccount[] = [];
  private seq = 1;

  private nextId(prefix: string): string {
    const id = `${prefix}_${this.seq}`;
    this.seq += 1;
    return id;
  }

  /**
   * Creates a new Workspace (`Organization`) and enrolls the creator as `OWNER`.
   */
  createWorkspace(params: {
    name: string;
    ownerUserId: string;
    image?: string | null;
  }): { workspace: Workspace; ownerMembership: WorkspaceMembership } {
    const cleanName = (params.name || "").trim();
    if (!cleanName) {
      throw new Error("Workspace name is required");
    }
    if (!params.ownerUserId) {
      throw new Error("ownerUserId is required");
    }

    const workspace: Workspace = {
      id: this.nextId("org"),
      name: cleanName,
      image: params.image ?? null,
    };
    this.workspaces.set(workspace.id, workspace);

    const ownerMembership: WorkspaceMembership = {
      id: this.nextId("mem"),
      organizationId: workspace.id,
      userId: params.ownerUserId,
      role: "OWNER",
      invitedName: null,
      invitedEmail: null,
    };
    this.memberships.push(ownerMembership);

    return { workspace, ownerMembership };
  }

  /**
   * Invites a team member by email to a workspace with an assigned role (`OWNER` | `ADMIN` | `USER`).
   */
  inviteTeamMember(params: {
    organizationId: string;
    actorUserId: string;
    invitedEmail: string;
    invitedName?: string;
    role?: MembershipRole;
  }): WorkspaceMembership {
    const actor = this.memberships.find(
      (m) => m.organizationId === params.organizationId && m.userId === params.actorUserId
    );
    if (!actor || !canManageMembers(actor.role)) {
      throw new Error("Insufficient permissions to invite team members");
    }

    const targetRole: MembershipRole = params.role ?? "USER";
    if (!canAssignRole(actor.role, targetRole)) {
      throw new Error(`Role ${actor.role} cannot assign ${targetRole}`);
    }

    const email = normalizeEmail(params.invitedEmail);
    const duplicate = this.memberships.find(
      (m) => m.organizationId === params.organizationId && m.invitedEmail === email
    );
    if (duplicate) {
      throw new Error(`Invitation already exists for ${email} in workspace ${params.organizationId}`);
    }

    const membership: WorkspaceMembership = {
      id: this.nextId("mem"),
      organizationId: params.organizationId,
      userId: null,
      role: targetRole,
      invitedName: params.invitedName?.trim() || null,
      invitedEmail: email,
    };
    this.memberships.push(membership);
    return membership;
  }

  /**
   * Accepts a workspace email invitation: sets `userId` and clears `invitedName` and `invitedEmail`
   * per `schema.prisma` specification.
   */
  acceptInvitation(params: {
    organizationId: string;
    invitedEmail: string;
    userId: string;
  }): WorkspaceMembership {
    const email = normalizeEmail(params.invitedEmail);
    const pending = this.memberships.find(
      (m) => m.organizationId === params.organizationId && m.invitedEmail === email
    );
    if (!pending) {
      throw new Error(`No pending invitation found for ${email}`);
    }

    pending.userId = params.userId;
    pending.invitedName = null;
    pending.invitedEmail = null;
    return pending;
  }

  /**
   * Links a Gmail, Google Workspace, Outlook, or Yahoo account to a workspace (`EmailAccount`).
   * Multiple email accounts can be attached to the same workspace.
   */
  addEmailAccountToWorkspace(params: {
    organizationId: string;
    actorUserId: string;
    name: string;
    email: string;
    provider?: EmailProvider;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
  }): LinkedEmailAccount {
    const member = this.memberships.find(
      (m) => m.organizationId === params.organizationId && m.userId === params.actorUserId
    );
    if (!member) {
      throw new Error("Only workspace members can link email accounts");
    }

    const normalized = normalizeEmail(params.email);
    const existing = this.emailAccounts.find(
      (e) => e.organizationId === params.organizationId && e.email === normalized
    );
    if (existing) {
      throw new Error(`Email account ${normalized} is already linked to this workspace`);
    }

    const account: LinkedEmailAccount = {
      id: this.nextId("acct"),
      organizationId: params.organizationId,
      name: params.name.trim() || normalized,
      email: normalized,
      provider: params.provider ?? "GMAIL",
      accessToken: params.accessToken ?? null,
      refreshToken: params.refreshToken ?? null,
      expiresAt: params.expiresAt ?? null,
    };
    this.emailAccounts.push(account);
    return account;
  }

  /**
   * Lists all workspaces a user belongs to along with their role and linked email accounts.
   */
  listUserWorkspaces(userId: string): Array<{
    workspace: Workspace;
    role: MembershipRole;
    emailAccounts: LinkedEmailAccount[];
  }> {
    return this.memberships
      .filter((m) => m.userId === userId)
      .map((m) => {
        const ws = this.workspaces.get(m.organizationId)!;
        const accts = this.emailAccounts.filter((a) => a.organizationId === m.organizationId);
        return {
          workspace: ws,
          role: m.role,
          emailAccounts: accts,
        };
      });
  }
}
