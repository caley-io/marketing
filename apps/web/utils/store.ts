import { GMailThread } from "@/app/api/google/threads/route";
import { type WorkspaceRecord } from "@/utils/workspace";
import { atom } from "jotai";
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

// Tracks the currently selected multitenant workspace ID across the mail shell.
export const activeWorkspaceIdAtom = atom<string | null>(null);

// Holds the list of workspaces accessible to the signed-in user.
export const workspacesAtom = atom<WorkspaceRecord[]>([]);

// Resolves the currently active workspace record from the loaded workspace list,
// falling back to the primary workspace when no explicit selection exists.
export function selectActiveWorkspace(
  workspaces: WorkspaceRecord[],
  activeWorkspaceId: string | null,
): WorkspaceRecord | null {
  if (workspaces.length === 0) return null;
  if (!activeWorkspaceId) return workspaces[0];
  return (
    workspaces.find((ws) => ws.id === activeWorkspaceId) ?? workspaces[0]
  );
}

