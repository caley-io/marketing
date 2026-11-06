/**
 * Multitenancy, Teams/Workspaces & Multi-Gmail Account Linking Manager
 * Bounty: caley-io/marketing #1 ($50 USD — Multitenancy and Teams/Workspaces Support)
 */
import { randomBytes } from 'node:crypto';

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface WorkspaceMember {
  userId: string;
  email: string;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface WorkspaceInvite {
  token: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  invitedByUserId: string;
  expiresAt: number;
  accepted: boolean;
}

export interface LinkedGmailAccount {
  email: string;
  googleSub: string;
  refreshTokenEncrypted: string;
  addedByUserId: string;
  linkedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  createdByUserId: string;
  members: WorkspaceMember[];
  linkedGmailAccounts: LinkedGmailAccount[];
}

export class WorkspaceMultitenancyService {
  private readonly workspaces = new Map<string, Workspace>();
  private readonly invites = new Map<string, WorkspaceInvite>();

  createWorkspace(input: { name: string; slug: string; ownerUserId: string; ownerEmail: string }): Workspace {
    const id = `ws_${randomBytes(6).toString('hex')}`;
    const workspace: Workspace = {
      id,
      name: input.name,
      slug: input.slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
      createdByUserId: input.ownerUserId,
      members: [{ userId: input.ownerUserId, email: input.ownerEmail.toLowerCase(), role: 'OWNER', joinedAt: new Date().toISOString() }],
      linkedGmailAccounts: [],
    };
    this.workspaces.set(id, workspace);
    return workspace;
  }

  private assertPermission(workspaceId: string, actorUserId: string, allowedRoles: WorkspaceRole[]): Workspace {
    const ws = this.workspaces.get(workspaceId);
    if (!ws) throw new Error(`Workspace ${workspaceId} not found`);
    const member = ws.members.find((m) => m.userId === actorUserId);
    if (!member || !allowedRoles.includes(member.role)) {
      throw new Error(`PermissionDenied: User ${actorUserId} lacks required role (${allowedRoles.join('/')})`);
    }
    return ws;
  }

  inviteMember(input: { workspaceId: string; actorUserId: string; inviteeEmail: string; role?: WorkspaceRole; ttlMs?: number }): WorkspaceInvite {
    this.assertPermission(input.workspaceId, input.actorUserId, ['OWNER', 'ADMIN']);
    const token = `inv_${randomBytes(12).toString('hex')}`;
    const invite: WorkspaceInvite = {
      token,
      workspaceId: input.workspaceId,
      email: input.inviteeEmail.toLowerCase(),
      role: input.role || 'MEMBER',
      invitedByUserId: input.actorUserId,
      expiresAt: Date.now() + (input.ttlMs ?? 7 * 24 * 3600 * 1000),
      accepted: false,
    };
    this.invites.set(token, invite);
    return invite;
  }

  acceptInvite(input: { token: string; userId: string; userEmail: string; now?: number }): Workspace {
    const invite = this.invites.get(input.token);
    if (!invite) throw new Error('Invalid invite token');
    if (invite.accepted) throw new Error('Invite token already accepted');
    if ((input.now ?? Date.now()) > invite.expiresAt) throw new Error('Invite token expired');
    if (invite.email !== input.userEmail.toLowerCase()) throw new Error('Invite email does not match authenticated user email');
    const ws = this.workspaces.get(invite.workspaceId);
    if (!ws) throw new Error('Workspace not found');
    if (!ws.members.some((m) => m.userId === input.userId)) {
      ws.members.push({ userId: input.userId, email: input.userEmail.toLowerCase(), role: invite.role, joinedAt: new Date().toISOString() });
    }
    invite.accepted = true;
    return ws;
  }

  linkGmailAccount(input: { workspaceId: string; actorUserId: string; gmailAddress: string; googleSub: string; refreshTokenEncrypted: string }): LinkedGmailAccount {
    const ws = this.assertPermission(input.workspaceId, input.actorUserId, ['OWNER', 'ADMIN']);
    const normalizedEmail = input.gmailAddress.toLowerCase();
    if (ws.linkedGmailAccounts.some((acc) => acc.email === normalizedEmail)) {
      throw new Error(`Gmail account ${normalizedEmail} is already linked to workspace ${ws.name}`);
    }
    const linked: LinkedGmailAccount = {
      email: normalizedEmail,
      googleSub: input.googleSub,
      refreshTokenEncrypted: input.refreshTokenEncrypted,
      addedByUserId: input.actorUserId,
      linkedAt: new Date().toISOString(),
    };
    ws.linkedGmailAccounts.push(linked);
    return linked;
  }
}
