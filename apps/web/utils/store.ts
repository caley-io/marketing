import { mails } from "@/components/mail/data";
import { GMailMessage, GMailThread } from "@/utils/gmail/types";
import { WorkspaceRole } from "@/utils/workspaces";
import { atom, useAtom } from "jotai";
import { LucideIcon } from "lucide-react";

type Config = {
  mail: GMailThread | null;
  selected: GMailThread["id"] | null;
};

export type Tab = {
  title: Tabs;
  label?: string;
  icon: LucideIcon;
  variant: "default" | "ghost";
  shortcut?: string;
};

export type Tabs =
  | "Inbox"
  | "Newsletters"
  | "Analytics"
  | "Drafts"
  | "Junk"
  | "Done"
  | "Team"
  | "Calendar"
  | "VIP"
  | "Sent"
  | "Drafts"
  | "Trash"
  | "Archive";

export interface WorkspaceMemberItem {
  id: string;
  role: WorkspaceRole;
  userId?: string | null;
  invitedEmail?: string | null;
  invitedName?: string | null;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export interface WorkspaceEmailAccountItem {
  id: string;
  name: string;
  email: string;
  organizationId: string;
}

export interface WorkspaceItem {
  id: string;
  name: string;
  image?: string | null;
  membership: WorkspaceMemberItem[];
  emailAccounts: WorkspaceEmailAccountItem[];
}

export const configAtom = atom<Config>({
  mail: null,
  selected: null,
});

export const tabAtom = atom<Tabs>("Inbox");

export const focusedThreadAtom = atom<GMailThread | null>(null);

export const focusedIndexAtom = atom<number>(-1);

export const openComposeAtom = atom<boolean>(false);

export const threadsAtom = atom<any>(null);

export const openCreateWorkspaceOpenAtom = atom<boolean>(false);

export const openWorkspaceSettingsAtom = atom<boolean>(false);

export const workspacesAtom = atom<WorkspaceItem[]>([]);

export const activeWorkspaceIdAtom = atom<string | null>(null);

export const activeEmailAccountAtom = atom<string | null>(null);
