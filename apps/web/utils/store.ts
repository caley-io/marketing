import { mails } from "@/components/mail/data";
import { GMailMessage, GMailThread } from "@/utils/gmail/types";
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
  | "Social"
  | "Updates"
  | "Forums"
  | "Shopping"
  | "Promotions"
  | "Starred"
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
