import { mails } from "@/components/mail/data";
import { GMailMessage, GMailThread } from "@/utils/gmail/types";
import { atom, useAtom } from "jotai";
import { LucideIcon } from "lucide-react";
import {
  EmailAssignment,
  TeamMember,
  defaultTeamMembers,
} from "@/utils/emailAssignment";

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
  | "Assigned to me"
  | "Calendar"
  | "VIP"
  | "Sent"
  | "Trash"
  | "Archive";

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

export const emailAssignmentsAtom = atom<Record<string, EmailAssignment>>({});

export const teamMembersAtom = atom<TeamMember[]>(defaultTeamMembers);
