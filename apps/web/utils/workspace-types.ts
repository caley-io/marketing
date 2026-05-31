import type { MembershipRole } from "@prisma/client";

export type WorkspaceEmailAccount = {
  id: string;
  name: string;
  email: string;
};

export type WorkspaceMember = {
  id: string;
  role: MembershipRole;
  invitedName: string | null;
  invitedEmail: string | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
};

export type WorkspaceSummary = {
  id: string;
  name: string;
  image: string | null;
  role: MembershipRole;
  emailAccounts: WorkspaceEmailAccount[];
  members: WorkspaceMember[];
};
