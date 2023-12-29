"use client";

import { ComponentProps } from "react";
import formatDistanceToNow from "date-fns/formatDistanceToNow";

import { cn } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAtom } from "jotai";
import { GMailMessage, GMailThread } from "@/utils/gmail/types";
import { configAtom } from "@/utils/store";

interface MailListProps {
  items: GMailThread[];
}

export function MailList({ items }: MailListProps) {
  const [mail, setMail] = useAtom(configAtom);
  return (
    <ScrollArea className="h-screen pb-32">
      <div className="flex flex-col gap-2 p-4 pt-0">
        {items.map((item) => (
          <button
            key={item.id}
            className={cn(
              "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
              mail.selected === item.id && "bg-muted",
            )}
            onClick={() =>
              setMail({
                mail: item,
                selected: item.id,
              })
            }
          >
            <div className="flex w-full flex-col gap-1">
              <div className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">
                    {item.messages[0].name.replace(/"/g, "")}
                  </div>
                  {!item.messages[0].read && (
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
                  {formatDistanceToNow(new Date(item.messages[0].date), {
                    addSuffix: true,
                  })}
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
                {item.messages[0].labels.map((label) => (
                  <Badge key={label} variant={getBadgeVariantFromLabel(label)}>
                    {label}
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

function getBadgeVariantFromLabel(
  label: string,
): ComponentProps<typeof Badge>["variant"] {
  if (["work"].includes(label.toLowerCase())) {
    return "default";
  }

  if (["personal"].includes(label.toLowerCase())) {
    return "outline";
  }

  return "secondary";
}
