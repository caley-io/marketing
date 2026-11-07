import { z } from "zod";

// Role hierarchy for workspace-level multitenancy access control.
// Legacy USER role maps to MEMBER privileges to preserve backward compatibility
// with early organization migrations.
export const WORKSPACE_ROLES = [
  "OWNER",
  "ADMIN",
  "MEMBER",
  "VIEWER",
  "USER",
] as const;

export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

const ROLE_WEIGHT: Record<WorkspaceRole, number> = {
  OWNER: 40,
  ADMIN: 30,
  MEMBER: 20,
  USER: 20,
  VIEWER: 10,
};

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2, "Workspace name must contain at least 2 characters").max(80),
  description: z.string().trim().max(240).optional(),
  image: z.string().url().optional(),
});

export const inviteMemberSchema = z.object({
  workspaceId: z.string().min(1),
  invitedEmail: z.string().trim().email(),
  invitedName: z.string().trim().min(1).max(120).optional(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
});

export const linkEmailAccountSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  provider: z.enum(["gmail", "google_workspace"]).default("gmail"),
  gmailAccessToken: z.string().min(1).optional(),
  gmailRefreshToken: z.string().min(1).optional(),
  gmailExpiresAt: z.date().optional(),
});

export interface WorkspaceMemberRecord {
  id: string;
  organizationId: string;
  userId: string | null;
  role: WorkspaceRole;
  invitedEmail: string | null;
  invitedName: string | null;
  inviteToken?: string | null;
}

export interface WorkspaceEmailAccountRecord {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  provider?: string;
  gmailAccessToken: string | null;
  gmailRefreshToken: string | null;
  gmailExpiresAt: Date | null;
}

export interface WorkspaceRecord {
  id: string;
  name: string;
  description?: string | null;
  image: string | null;
  membership: WorkspaceMemberRecord[];
  emailAccounts: WorkspaceEmailAccountRecord[];
}

export interface InvitationMailPayload {
  workspaceId: string;
  workspaceName: string;
  invitedEmail: string;
  invitedName?: string;
  role: WorkspaceRole;
  inviteToken: string;
}

export interface WorkspaceRepository {
  createOrganization(input: {
    name: string;
    description?: string;
    image?: string;
    ownerUserId: string;
  }): Promise<WorkspaceRecord>;
  findWorkspaceById(workspaceId: string): Promise<WorkspaceRecord | null>;
  listUserWorkspaces(userId: string): Promise<WorkspaceRecord[]>;
  upsertMemberInvitation(input: {
    workspaceId: string;
    invitedEmail: string;
    invitedName?: string;
    role: WorkspaceRole;
    inviteToken: string;
  }): Promise<WorkspaceMemberRecord>;
  bindInvitationToUser(input: {
    workspaceId: string;
    invitedEmail: string;
    userId: string;
  }): Promise<WorkspaceMemberRecord>;
  updateMembershipRole(input: {
    membershipId: string;
    role: WorkspaceRole;
  }): Promise<WorkspaceMemberRecord>;
  createEmailAccount(input: {
    workspaceId: string;
    name: string;
    email: string;
    provider: string;
    gmailAccessToken?: string;
    gmailRefreshToken?: string;
    gmailExpiresAt?: Date;
  }): Promise<WorkspaceEmailAccountRecord>;
  deleteEmailAccount(input: {
    workspaceId: string;
    accountId: string;
  }): Promise<void>;
}

// Evaluates whether a workspace member role meets the minimum privilege threshold
// required for sensitive tenant mutations.
export function hasRequiredRole(
  actorRole: WorkspaceRole | null | undefined,
  minimumRole: WorkspaceRole,
): boolean {
  if (!actorRole) return false;
  return ROLE_WEIGHT[actorRole] >= ROLE_WEIGHT[minimumRole];
}

// Resolves the effective workspace role held by a specific authenticated user
// inside a tenant record.
export function resolveActorRole(
  workspace: WorkspaceRecord,
  actorUserId: string,
): WorkspaceRole | null {
  const match = workspace.membership.find(
    (member) => member.userId === actorUserId,
  );
  return match ? match.role : null;
}

// Enforces that the caller possesses sufficient RBAC privileges before mutating
// workspace memberships or linked Google accounts.
export function assertWorkspacePermission(
  context: { workspace: WorkspaceRecord; actorUserId: string },
  minimumRole: WorkspaceRole,
): WorkspaceRole {
  const actorRole = resolveActorRole(context.workspace, context.actorUserId);
  if (!hasRequiredRole(actorRole, minimumRole)) {
    throw new Error("Insufficient workspace permissions for this operation");
  }
  return actorRole as WorkspaceRole;
}

function normalizeEmail(rawEmail: string): string {
  return rawEmail.trim().toLowerCase();
}

function generateInviteToken(workspaceId: string, email: string): string {
  const normalized = normalizeEmail(email);
  const entropy = Math.random().toString(36).slice(2, 10);
  return `ws_${workspaceId}_${Buffer.from(normalized).toString("hex").slice(0, 12)}_${entropy}`;
}

export interface CreateWorkspaceCommand {
  actorUserId: string;
  name: string;
  description?: string;
  image?: string;
}

// Provisions an isolated workspace tenant and assigns the creating user as OWNER
// so personal and team inboxes remain segregated across organizations.
export async function createWorkspace(
  repository: WorkspaceRepository,
  command: CreateWorkspaceCommand,
): Promise<WorkspaceRecord> {
  const parsed = createWorkspaceSchema.parse({
    name: command.name,
    description: command.description,
    image: command.image,
  });

  return await repository.createOrganization({
    name: parsed.name,
    description: parsed.description,
    image: parsed.image,
    ownerUserId: command.actorUserId,
  });
}

export interface InviteWorkspaceMemberCommand {
  actorUserId: string;
  workspaceId: string;
  invitedEmail: string;
  invitedName?: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  sendInviteEmail?: (payload: InvitationMailPayload) => Promise<void>;
}

async function loadAuthorizedWorkspace(
  repository: WorkspaceRepository,
  access: { workspaceId: string; actorUserId: string; minimumRole: WorkspaceRole },
): Promise<{ workspace: WorkspaceRecord; actorRole: WorkspaceRole }> {
  const workspace = await repository.findWorkspaceById(access.workspaceId);
  if (!workspace) {
    throw new Error("Workspace not found");
  }
  const actorRole = assertWorkspacePermission(
    { workspace, actorUserId: access.actorUserId },
    access.minimumRole,
  );
  return { workspace, actorRole };
}

// Registers a role-scoped email invitation for a teammate and dispatches an
// invitation notification when an email transport callback is configured.
export async function inviteWorkspaceMember(
  repository: WorkspaceRepository,
  command: InviteWorkspaceMemberCommand,
): Promise<WorkspaceMemberRecord> {
  const parsed = inviteMemberSchema.parse({
    workspaceId: command.workspaceId,
    invitedEmail: command.invitedEmail,
    invitedName: command.invitedName,
    role: command.role,
  });

  const { workspace, actorRole } = await loadAuthorizedWorkspace(repository, {
    workspaceId: parsed.workspaceId,
    actorUserId: command.actorUserId,
    minimumRole: "ADMIN",
  });

  if (parsed.role === "OWNER" && actorRole !== "OWNER") {
    throw new Error("Only an existing workspace owner can assign the OWNER role");
  }

  const normalizedEmail = normalizeEmail(parsed.invitedEmail);
  const inviteToken = generateInviteToken(workspace.id, normalizedEmail);

  const membership = await repository.upsertMemberInvitation({
    workspaceId: workspace.id,
    invitedEmail: normalizedEmail,
    invitedName: parsed.invitedName,
    role: parsed.role,
    inviteToken,
  });

  if (command.sendInviteEmail) {
    await command.sendInviteEmail({
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      invitedEmail: normalizedEmail,
      invitedName: parsed.invitedName,
      role: parsed.role,
      inviteToken,
    });
  }

  return membership;
}

export interface AcceptWorkspaceInviteCommand {
  workspaceId: string;
  userId: string;
  userEmail: string;
}

// Converts a pending email invitation into an active user membership and clears
// staging invitation fields as required by the Prisma Membership invariant.
export async function acceptWorkspaceInvitation(
  repository: WorkspaceRepository,
  command: AcceptWorkspaceInviteCommand,
): Promise<WorkspaceMemberRecord> {
  const normalizedEmail = normalizeEmail(command.userEmail);
  const workspace = await repository.findWorkspaceById(command.workspaceId);
  if (!workspace) {
    throw new Error("Workspace not found");
  }

  const pendingInvite = workspace.membership.find(
    (m) => m.invitedEmail && normalizeEmail(m.invitedEmail) === normalizedEmail,
  );
  if (!pendingInvite) {
    throw new Error("No pending invitation found for this email address");
  }

  return await repository.bindInvitationToUser({
    workspaceId: command.workspaceId,
    invitedEmail: normalizedEmail,
    userId: command.userId,
  });
}

export interface LinkWorkspaceAccountCommand {
  actorUserId: string;
  workspaceId: string;
  name: string;
  email: string;
  provider?: "gmail" | "google_workspace";
  gmailAccessToken?: string;
  gmailRefreshToken?: string;
  gmailExpiresAt?: Date;
}

// Attaches a Gmail or Google Workspace inbox account to a workspace after
// verifying admin privileges and preventing duplicate address registration.
export async function addWorkspaceEmailAccount(
  repository: WorkspaceRepository,
  command: LinkWorkspaceAccountCommand,
): Promise<WorkspaceEmailAccountRecord> {
  const parsed = linkEmailAccountSchema.parse({
    workspaceId: command.workspaceId,
    name: command.name,
    email: command.email,
    provider: command.provider ?? "gmail",
    gmailAccessToken: command.gmailAccessToken,
    gmailRefreshToken: command.gmailRefreshToken,
    gmailExpiresAt: command.gmailExpiresAt,
  });

  const { workspace } = await loadAuthorizedWorkspace(repository, {
    workspaceId: parsed.workspaceId,
    actorUserId: command.actorUserId,
    minimumRole: "ADMIN",
  });

  const normalizedEmail = normalizeEmail(parsed.email);
  const alreadyLinked = workspace.emailAccounts.some(
    (account) => normalizeEmail(account.email) === normalizedEmail,
  );
  if (alreadyLinked) {
    throw new Error("Email account is already linked to this workspace");
  }

  return await repository.createEmailAccount({
    workspaceId: workspace.id,
    name: parsed.name,
    email: normalizedEmail,
    provider: parsed.provider,
    gmailAccessToken: parsed.gmailAccessToken,
    gmailRefreshToken: parsed.gmailRefreshToken,
    gmailExpiresAt: parsed.gmailExpiresAt,
  });
}

export interface RemoveWorkspaceAccountCommand {
  actorUserId: string;
  workspaceId: string;
  accountId: string;
}

// Disconnects a linked Gmail or Google Workspace account from a workspace tenant.
export async function removeWorkspaceEmailAccount(
  repository: WorkspaceRepository,
  command: RemoveWorkspaceAccountCommand,
): Promise<void> {
  await loadAuthorizedWorkspace(repository, {
    workspaceId: command.workspaceId,
    actorUserId: command.actorUserId,
    minimumRole: "ADMIN",
  });

  await repository.deleteEmailAccount({
    workspaceId: command.workspaceId,
    accountId: command.accountId,
  });
}
