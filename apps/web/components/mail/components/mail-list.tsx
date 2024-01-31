"use client";

import { ComponentProps, useEffect, useRef, useState } from "react";
import formatDistanceToNow from "date-fns/formatDistanceToNow";

import { cn } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAtom } from "jotai";
import { GMailMessage, GMailThread } from "@/utils/gmail/types";
import { configAtom, focusedIndexAtom, focusedThreadAtom } from "@/utils/store";
import { set } from "lodash";
import { postRequest } from "@/utils/api";
import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "@/providers/SWRProvider";

interface MailListProps {
  items: GMailThread[];
}

export function MailList({ items }: MailListProps) {
  const [mail, setMail] = useAtom(configAtom);
  const [focusedIndex, setFocusedIndex] = useAtom(focusedIndexAtom);
  const [focusedThread, setFocusedThread] = useAtom(focusedThreadAtom);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const { mutate } = useSWR("api/google/threads", fetcher);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, items.length);
  }, [items]);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === "j") {
        setFocusedIndex((prev) => {
          const nextIndex = prev < items.length - 1 ? prev + 1 : prev;
          if (
            itemRefs.current[nextIndex] &&
            itemRefs.current[nextIndex] !== null
          ) {
            itemRefs?.current[nextIndex]?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            });
          }
          setFocusedThread(items[nextIndex]);
          return nextIndex;
        });
      } else if (e.key === "k") {
        setFocusedIndex((prev) => {
          const nextIndex = prev > 0 ? prev - 1 : 0;
          if (
            itemRefs.current[nextIndex] &&
            itemRefs.current[nextIndex] !== null
          ) {
            itemRefs?.current[nextIndex]?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            });
          }
          setFocusedThread(items[nextIndex]);
          return nextIndex;
        });
      } else if (e.key === "Enter" && focusedIndex !== -1) {
        const selectedItem = items[focusedIndex];
        const threadId = selectedItem.id;
        await postRequest("/api/google/threads/mark-as-read", { id: threadId });
        selectedItem.messages.forEach((message) => {
          message.read = true;
        });

        mutate({ ...items, selectedItem });
        setMail({
          mail: selectedItem,
          selected: selectedItem.id,
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [items, setMail, focusedIndex, mutate, setFocusedThread]);
  return (
    <ScrollArea className="h-screen pb-32">
      <div className="flex flex-col gap-2 p-4 pt-0">
        {items.map((item, index) => (
          <button
            key={item.id}
            ref={(el) => (itemRefs.current[index] = el)}
            className={cn(
              "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
              mail.selected === item.id && "bg-muted",
              focusedIndex === index && "bg-muted/60",
            )}
            onClick={async () => {
              const threadId = item.id;
              await postRequest("/api/google/threads/mark-as-read", {
                id: threadId,
              });
              item.messages.forEach((message) => {
                message.read = true;
              });

              mutate({ ...items, item });
              setMail({
                mail: item,
                selected: item.id,
              });
            }}
          >
            <div className="flex w-full flex-col gap-1">
              <div className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">
                    {item.messages[0].name.replace(/"/g, "")}
                  </div>
                  {!item.messages[item.messages.length - 1].read && (
                    <span className="flex h-2 w-2 rounded-full bg-blue-600" />
                  )}
                </div>
                <div
                  className={cn(
                    "ml-auto text-xs",
                    mail.selected === item.id
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {formatDistanceToNow(
                    new Date(item.messages[item.messages.length - 1].date),
                    {
                      addSuffix: true,
                    },
                  )}
                </div>
              </div>
              <div className="text-xs font-medium">
                {item.messages[0].subject}
              </div>
            </div>
            <div className="line-clamp-2 text-xs text-muted-foreground">
              {item.messages[0].snippet}
            </div>
            {item.messages[0].labels.length ? (
              <div className="flex items-center gap-2">
                {item.messages[0].labels
                  .filter(
                    (label) =>
                      !label.toLowerCase().includes("unread") &&
                      !label.toLowerCase().includes("label_"),
                  )
                  .map((label) => (
                    <Badge
                      key={label}
                      variant={getBadgeVariantFromLabel(label)}
                    >
                      {getBadgeTextFormatted(label)}
                    </Badge>
                  ))}
              </div>
            ) : null}
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}

export function getBadgeVariantFromLabel(
  label: string,
): ComponentProps<typeof Badge>["variant"] {
  if (label.toLowerCase().includes("work")) {
    return "default";
  }

  if (label.toLowerCase().includes("personal")) {
    return "outline";
  }

  return "secondary";
}

export function getBadgeTextFormatted(label: string) {
  if (label.toLowerCase().includes("work")) {
    return "Work";
  }

  if (label.toLowerCase().includes("personal")) {
    return "Personal";
  }

  if (label.toLowerCase().includes("updates")) {
    return "Updates";
  }

  if (label.toLowerCase().includes("forums")) {
    return "Forums";
  }

  if (label.toLowerCase().includes("promotions")) {
    return "Promotions";
  }

  if (label.toLowerCase().includes("social")) {
    return "Social";
  }

  if (label.toLowerCase().includes("inbox")) {
    return "Inbox";
  }

  if (label.toLowerCase().includes("sent")) {
    return "Sent";
  }

  if (label.toLowerCase().includes("drafts")) {
    return "Drafts";
  }

  if (label.toLowerCase().includes("trash")) {
    return "Trash";
  }

  if (label.toLowerCase().includes("spam")) {
    return "Spam";
  }

  if (label.toLowerCase().includes("important")) {
    return "Important";
  }

  return label;
}
