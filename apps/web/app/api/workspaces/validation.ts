import { z } from "zod";

export const workspaceRoleEnum = z.enum(["OWNER", "ADMIN", "USER"]);
export type WorkspaceRole = z.infer<typeof workspaceRoleEnum>;

export const createWorkspaceBody = z.object({
  name: z.string().trim().min(1, "Workspace name is required").max(100),
  image: z.string().url().optional().nullable(),
});
export type CreateWorkspaceBody = z.infer<typeof createWorkspaceBody>;

export const inviteMemberBody = z.object({
  email: z.string().trim().email("Valid email address is required"),
  name: z.string().trim().max(100).optional(),
  role: workspaceRoleEnum.default("USER"),
});
export type InviteMemberBody = z.infer<typeof inviteMemberBody>;

export const addEmailAccountBody = z.object({
  name: z.string().trim().min(1, "Account label is required").max(100),
  email: z.string().trim().email("Valid Gmail/Workspace email is required"),
  gmailAccessToken: z.string().optional(),
  gmailRefreshToken: z.string().optional(),
});
export type AddEmailAccountBody = z.infer<typeof addEmailAccountBody>;
