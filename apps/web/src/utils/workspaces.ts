export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface WorkspaceMember {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  members: WorkspaceMember[];
}

export function canManageWorkspace(member: WorkspaceMember | undefined): boolean {
  if (!member) return false;
  return member.role === 'OWNER' || member.role === 'ADMIN';
}

export function canAccessWorkspace(userId: string, workspace: Workspace): boolean {
  if (workspace.ownerId === userId) return true;
  return workspace.members.some((m) => m.userId === userId);
}
