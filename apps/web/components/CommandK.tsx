"use client";

import * as React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import {
  AlertCircle,
  Archive,
  ArchiveX,
  Gauge,
  InboxIcon,
  MessagesSquare,
  Newspaper,
  Send,
  ShoppingCart,
  Trash2,
  Users2,
  File,
  BookCheck,
  Eye,
  Mail,
  Folder,
  FileIcon,
  FilterIcon,
  Search,
  Settings,
  HelpCircle,
  Keyboard,
  Feather,
  CircleDollarSign,
  DoorClosed,
  ReplyIcon,
  ReplyAll,
  Forward,
} from "lucide-react";
import { useAtom, useAtomValue } from "jotai";
import {
  Tab,
  focusedThreadAtom,
  openComposeAtom,
  tabAtom,
} from "@/utils/store";
import { markAsReadAction, markAsUnreadAction } from "@/utils/actions";
import { postRequest } from "@/utils/api";
import { EyeClosedIcon, EyeOpenIcon } from "@radix-ui/react-icons";

const links: Tab[] = [
  {
    title: "Inbox",
    icon: InboxIcon,
    variant: "default",
    shortcut: "gi",
  },
  {
    title: "Newsletters",
    icon: Newspaper,
    variant: "ghost",
    shortcut: "gn",
  },
  {
    title: "Analytics",
    icon: Gauge,
    variant: "ghost",
    shortcut: "ga",
  },
  {
    title: "Drafts",
    icon: File,
    variant: "ghost",
    shortcut: "gd",
  },
  {
    title: "Sent",
    icon: Send,
    variant: "ghost",
    shortcut: "gs",
  },
  {
    title: "Junk",
    icon: ArchiveX,
    variant: "ghost",
    shortcut: "gj",
  },
  {
    title: "Trash",
    icon: Trash2,
    variant: "ghost",
    shortcut: "gt",
  },
  {
    title: "Archive",
    icon: Archive,
    variant: "ghost",
    shortcut: "gk",
  },
  {
    title: "Social",
    icon: Users2,
    variant: "ghost",
    shortcut: "gl",
  },
  {
    title: "Updates",
    icon: AlertCircle,
    variant: "ghost",
    shortcut: "gu",
  },
  {
    title: "Forums",
    icon: MessagesSquare,
    variant: "ghost",
    shortcut: "gf",
  },
  {
    title: "Shopping",
    icon: ShoppingCart,
    variant: "ghost",
    shortcut: "gg",
  },
  {
    title: "Promotions",
    icon: Archive,
    variant: "ghost",
    shortcut: "gp",
  },
];

const markActions = [
  {
    title: "Mark as read",
    icon: EyeOpenIcon,
    shortcut: "ma",
  },
  {
    title: "Mark as unread",
    icon: EyeClosedIcon,
    shortcut: "mu",
  },
];

const moveActions = [
  {
    title: "Move to inbox",
    icon: InboxIcon,
    shortcut: "vi",
  },
  {
    title: "Move to junk",
    icon: ArchiveX,
    shortcut: "vj",
  },
  {
    title: "Move to trash",
    icon: Trash2,
    shortcut: "vt",
  },
  {
    title: "Move to archive",
    icon: Archive,
    shortcut: "vk",
  },
];

const createActions = [
  {
    title: "New email",
    icon: Mail,
    shortcut: "cc",
  },
  {
    title: "New folder",
    icon: Folder,
    shortcut: "cf",
  },
  {
    title: "New label",
    icon: FileIcon,
    shortcut: "cl",
  },
  {
    title: "New filter",
    icon: FilterIcon,
    shortcut: "cr",
  },
];

const searchActions = [
  {
    title: "Search in inbox",
    icon: Search,
    shortcut: "si",
  },
  {
    title: "Search in junk",
    icon: Search,
    shortcut: "sj",
  },
  {
    title: "Search in trash",
    icon: Search,
    shortcut: "st",
  },
  {
    title: "Search in archive",
    icon: Search,
    shortcut: "sk",
  },
];

const settingsActions = [
  {
    title: "Settings",
    icon: Settings,
    shortcut: "xs",
  },
  {
    title: "Help",
    icon: HelpCircle,
    shortcut: "xh",
  },
  {
    title: "Keyboard shortcuts",
    icon: Keyboard,
    shortcut: "x?",
  },
  {
    title: "Feedback",
    icon: Feather,
    shortcut: "xf",
  },
];

const accountActions = [
  {
    title: "Account",
    icon: CircleDollarSign,
    shortcut: "aa",
  },
  {
    title: "Sign out",
    icon: DoorClosed,
    shortcut: "ao",
  },
];

const replyActions = [
  {
    title: "Reply",
    icon: ReplyIcon,
    shortcut: "rr",
  },
  {
    title: "Reply all",
    icon: ReplyAll,
    shortcut: "ra",
  },
  {
    title: "Forward",
    icon: Forward,
    shortcut: "rf",
  },
];

export function CommandK() {
  const [open, setOpen] = React.useState(false);
  const [lastKeyPressed, setLastKeyPressed] = React.useState("");
  const [selectedTab, setSelectedTab] = useAtom(tabAtom);
  const focusedThread = useAtomValue(focusedThreadAtom);
  const [composeOpen, setComposeOpen] = useAtom(openComposeAtom);

  const handleMarkAsRead = async (threadId: string) => {
    await postRequest("/api/google/threads/mark-as-read", { id: threadId });
    focusedThread?.messages.forEach((message) => {
      message.read = true;
    });
  };

  const handleMarkAsUnread = async (threadId: string) => {
    await postRequest("/api/google/threads/mark-as-unread", { id: threadId });
    focusedThread?.messages.forEach((message) => {
      message.read = false;
    });
  };

  React.useEffect(() => {
    const down = async (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
        return;
      }

      setLastKeyPressed(e.key);

      if (lastKeyPressed === "g") {
        const shortcut = `g${e.key}`;
        const link = links.find((link) => link.shortcut === shortcut);
        if (link) {
          setSelectedTab(link.title);
          setOpen(false);
        }
        setLastKeyPressed(""); // Reset the last key pressed
      }

      if (lastKeyPressed === "m") {
        const shortcut = `m${e.key}`;
        const markAction = markActions.find(
          (action) => action.shortcut === shortcut,
        );
        if (markAction) {
          // Execute the action's logic here (e.g., setOpen(false))
          // For now, just closing the dialog
          if (markAction.title === "Mark as read") {
            const threadId = focusedThread?.id;
            await handleMarkAsRead(threadId || "");
            setOpen(false);
          }

          if (markAction.title === "Mark as unread") {
            const threadId = focusedThread?.id;
            await handleMarkAsUnread(threadId || "");
            setOpen(false);
          }
          setOpen(false);
        }
        setLastKeyPressed(""); // Reset the last key pressed
      }

      if (lastKeyPressed === "v") {
        const shortcut = `v${e.key}`;
        const moveAction = moveActions.find(
          (action) => action.shortcut === shortcut,
        );
        if (moveAction) {
          // Execute the action's logic here (e.g., setOpen(false))
          // For now, just closing the dialog
          setOpen(false);
        }
        setLastKeyPressed(""); // Reset the last key pressed
      }

      if (lastKeyPressed === "c") {
        const shortcut = `c${e.key}`;
        const createAction = createActions.find(
          (action) => action.shortcut === shortcut,
        );
        if (createAction) {
          if (createAction.title === "New email") {
            setComposeOpen(true);
          }
          setOpen(false);
        }
        setLastKeyPressed(""); // Reset the last key pressed
      }

      if (lastKeyPressed === "s") {
        const shortcut = `s${e.key}`;
        const searchAction = searchActions.find(
          (action) => action.shortcut === shortcut,
        );
        if (searchAction) {
          // Execute the action's logic here (e.g., setOpen(false))
          // For now, just closing the dialog
          setOpen(false);
        }
        setLastKeyPressed(""); // Reset the last key pressed
      }

      if (lastKeyPressed === "x") {
        const shortcut = `x${e.key}`;
        const settingsAction = settingsActions.find(
          (action) => action.shortcut === shortcut,
        );
        if (settingsAction) {
          // Execute the action's logic here (e.g., setOpen(false))
          // For now, just closing the dialog
          setOpen(false);
        }
        setLastKeyPressed(""); // Reset the last key pressed
      }

      if (lastKeyPressed === "a") {
        const shortcut = `a${e.key}`;
        const accountAction = accountActions.find(
          (action) => action.shortcut === shortcut,
        );
        if (accountAction) {
          // Execute the action's logic here (e.g., setOpen(false))
          // For now, just closing the dialog
          setOpen(false);
        }
        setLastKeyPressed(""); // Reset the last key pressed
      }

      if (lastKeyPressed === "r") {
        const shortcut = `r${e.key}`;
        const replyAction = replyActions.find(
          (action) => action.shortcut === shortcut,
        );
        if (replyAction) {
          // Execute the action's logic here (e.g., setOpen(false))
          // For now, just closing the dialog
          setOpen(false);
        }
        setLastKeyPressed(""); // Reset the last key pressed
      }

      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    if (!composeOpen) {
      document.addEventListener("keydown", down);
      return () => document.removeEventListener("keydown", down);
    }
  }, [
    setSelectedTab,
    setOpen,
    lastKeyPressed,
    focusedThread,
    composeOpen,
    setComposeOpen,
    handleMarkAsRead,
    handleMarkAsUnread,
  ]);

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {links.map((option) => (
              <CommandItem
                key={option.title}
                onSelect={() => {
                  setSelectedTab(option.title);
                  setOpen(false);
                }}
              >
                <option.icon className="mr-2 h-4 w-4" />
                <span>{option.title}</span>
                <CommandShortcut>{option.shortcut}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Mark">
            {markActions.map((option) => (
              <CommandItem
                key={option.title}
                onSelect={() => {
                  setOpen(false);
                }}
              >
                <option.icon className="mr-2 h-4 w-4" />
                <span>{option.title}</span>
                <CommandShortcut>{option.shortcut}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Move">
            {moveActions.map((option) => (
              <CommandItem
                key={option.title}
                onSelect={() => {
                  setOpen(false);
                }}
              >
                <option.icon className="mr-2 h-4 w-4" />
                <span>{option.title}</span>
                <CommandShortcut>{option.shortcut}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Create">
            {createActions.map((option) => (
              <CommandItem
                key={option.title}
                onSelect={() => {
                  setOpen(false);
                }}
              >
                <option.icon className="mr-2 h-4 w-4" />
                <span>{option.title}</span>
                <CommandShortcut>{option.shortcut}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Search">
            {searchActions.map((option) => (
              <CommandItem
                key={option.title}
                onSelect={() => {
                  setOpen(false);
                }}
              >
                <option.icon className="mr-2 h-4 w-4" />
                <span>{option.title}</span>
                <CommandShortcut>{option.shortcut}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Settings">
            {settingsActions.map((option) => (
              <CommandItem
                key={option.title}
                onSelect={() => {
                  setOpen(false);
                }}
              >
                <option.icon className="mr-2 h-4 w-4" />
                <span>{option.title}</span>
                <CommandShortcut>{option.shortcut}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Account">
            {accountActions.map((option) => (
              <CommandItem
                key={option.title}
                onSelect={() => {
                  setOpen(false);
                }}
              >
                <option.icon className="mr-2 h-4 w-4" />
                <span>{option.title}</span>
                <CommandShortcut>{option.shortcut}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Reply">
            {replyActions.map((option) => (
              <CommandItem
                key={option.title}
                onSelect={() => {
                  setOpen(false);
                }}
              >
                <option.icon className="mr-2 h-4 w-4" />
                <span>{option.title}</span>
                <CommandShortcut>{option.shortcut}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
