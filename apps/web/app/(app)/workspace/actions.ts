'use server';

import { auth } from "@/app/api/auth/[...nextauth]/auth";

export async function createWorkspace(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }
  const name = formData.get("name") as string;
  if (!name) {
    throw new Error("Workspace name is required");
  }
  // Stub implementation for workspace creation supporting multitenancy
  return { success: true, workspaceId: "ws_" + Math.random().toString(36).substr(2, 9), name };
}

export async function inviteTeamMember(workspaceId: string, email: string, role: string) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }
  // Stub implementation for email invitation and role assignment
  return { success: true, workspaceId, email, role };
}
