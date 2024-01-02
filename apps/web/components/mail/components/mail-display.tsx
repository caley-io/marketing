import addDays from "date-fns/addDays";
import addHours from "date-fns/addHours";
import format from "date-fns/format";
import nextSaturday from "date-fns/nextSaturday";
import {
  Archive,
  ArchiveX,
  Clock,
  Forward,
  MoreVertical,
  Reply,
  ReplyAll,
  Trash2,
} from "lucide-react";

import {
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import DOMPurify from "dompurify";
import { GMailMessage, GMailThread } from "@/utils/gmail/types";
import { cn } from "@/utils";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { useEffect } from "react";

interface MailDisplayProps {
  mail: GMailThread | null;
}
// Define the pattern that typically precedes quoted text in a reply
function extractLatestReply(emailContent: string): string {
  // Define the pattern that typically precedes quoted text in a reply
  const replyPattern = /On .+ wrote:/;
  const parts = emailContent.split(replyPattern);

  // The latest reply is typically before the first occurrence of the pattern
  const latestReply = parts[0].trim();

  // If the pattern isn't found, try to extract the reply using the "Sent via" pattern
  // First, try to find the index where "Sent via" starts
  const sentViaIndex = latestReply.search(/Sent via .+/);

  if (sentViaIndex !== -1) {
    // If "Sent via" is found, return everything before it
    return latestReply.substring(0, sentViaIndex).trim();
  }

  // If no patterns are found, return the whole content
  return latestReply.trim();
}

function formatPlainTextEmail(text: string): string {
  // First, safely convert line breaks to <br> tags
  let formattedText = text.replace(/\n/g, "<br>");

  // Next, find and replace the "Sent via [Service] <URL>" pattern
  formattedText = formattedText.replace(
    /Sent via ([^<]+) <(https?:\/\/[^>]+)>/g,
    (_, service, url) => {
      return `Sent via <a href="${url}" target="_blank" rel="noopener noreferrer" style="color: rgb(37 99 235); text-decoration: underline;">${service}</a>`;
    },
  );

  // Finally, convert any other standalone URLs to clickable links
  formattedText = formattedText.replace(
    /(?<!href=")(https?:\/\/\S+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: rgb(37 99 235); text-decoration: underline;">$1</a>',
  );

  return formattedText;
}

export function MailDisplay({ mail }: MailDisplayProps) {
  const today = new Date();
  const session = useSession();
  const email = session.data?.user.email;

  console.log(mail);

  useEffect(() => {
    const iframes = document.querySelectorAll("iframe");

    iframes.forEach((iframe) => {
      iframe.onload = () => {
        try {
          const body = iframe.contentWindow?.document.body;
          const html = iframe.contentWindow?.document.documentElement;
          if (!body || !html) {
            return;
          }
          const height = Math.max(
            body.scrollHeight,
            body.offsetHeight,
            html.clientHeight,
            html.scrollHeight,
            html.offsetHeight,
          );
          iframe.style.height = `${height}px`;
        } catch (error) {
          console.error("Error resizing iframe:", error);
        }
      };
    });
  }, []);

  const createMarkup = (htmlContent: any) => {
    return { __html: DOMPurify.sanitize(htmlContent) };
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center p-2">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!mail}>
                <Archive className="h-4 w-4" />
                <span className="sr-only">Archive</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Archive</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!mail}>
                <ArchiveX className="h-4 w-4" />
                <span className="sr-only">Move to junk</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Move to junk</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!mail}>
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Move to trash</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Move to trash</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Tooltip>
            <Popover>
              <PopoverTrigger asChild>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!mail}>
                    <Clock className="h-4 w-4" />
                    <span className="sr-only">Snooze</span>
                  </Button>
                </TooltipTrigger>
              </PopoverTrigger>
              <PopoverContent className="flex w-[535px] p-0">
                <div className="flex flex-col gap-2 border-r px-2 py-4">
                  <div className="px-4 text-sm font-medium">Snooze until</div>
                  <div className="grid min-w-[250px] gap-1">
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                    >
                      Later today{" "}
                      <span className="ml-auto text-muted-foreground">
                        {format(addHours(today, 4), "E, h:m b")}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                    >
                      Tomorrow
                      <span className="ml-auto text-muted-foreground">
                        {format(addDays(today, 1), "E, h:m b")}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                    >
                      This weekend
                      <span className="ml-auto text-muted-foreground">
                        {format(nextSaturday(today), "E, h:m b")}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                    >
                      Next week
                      <span className="ml-auto text-muted-foreground">
                        {format(addDays(today, 7), "E, h:m b")}
                      </span>
                    </Button>
                  </div>
                </div>
                <div className="p-2">
                  <Calendar />
                </div>
              </PopoverContent>
            </Popover>
            <TooltipContent>Snooze</TooltipContent>
          </Tooltip>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!mail}>
                <Reply className="h-4 w-4" />
                <span className="sr-only">Reply</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reply</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!mail}>
                <ReplyAll className="h-4 w-4" />
                <span className="sr-only">Reply all</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reply all</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!mail}>
                <Forward className="h-4 w-4" />
                <span className="sr-only">Forward</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Forward</TooltipContent>
          </Tooltip>
        </div>
        <Separator orientation="vertical" className="mx-2 h-6" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={!mail}>
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Mark as unread</DropdownMenuItem>
            <DropdownMenuItem>Star thread</DropdownMenuItem>
            <DropdownMenuItem>Add label</DropdownMenuItem>
            <DropdownMenuItem>Mute thread</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Separator />
      {mail ? (
        <div className="flex h-full flex-col">
          <div className="flex items-start p-4">
            <div className="flex items-start gap-4 text-sm">
              <Avatar>
                <AvatarImage alt={mail.messages[0].name} />
                <AvatarFallback>
                  {mail.messages[0].name
                    .split(" ")
                    .map((chunk) => chunk[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <div className="font-semibold">{mail.messages[0].name}</div>
                <div className="line-clamp-1 text-xs">
                  {mail.messages[0].subject}
                </div>
                <div className="line-clamp-1 text-xs">
                  <span className="font-medium">Reply-To:</span>{" "}
                  {mail.messages[0].email}
                </div>
              </div>
            </div>
            {mail.messages[0].date && (
              <div className="ml-auto text-xs text-muted-foreground">
                {format(new Date(mail.messages[0].date), "PPpp")}
              </div>
            )}
          </div>
          <Separator />
          <div className="relative flex-1 overflow-y-auto">
            {mail.messages.length > 1 ? (
              <div className="space-y-4 p-4">
                {mail.messages.map((message: GMailMessage, index) => (
                  <div
                    key={message.id}
                    className={cn("flex flex-col items-start", {
                      "flex flex-col items-end": message.email.includes(
                        email || "",
                      ),
                    })}
                  >
                    {message.isHtmlEmail ? (
                      <div className="flex h-full w-full flex-col">
                        <div
                          className={
                            "ml-auto p-2 text-xs text-muted-foreground"
                          }
                        >
                          {formatDistanceToNow(new Date(message.date), {
                            addSuffix: true,
                          })}
                        </div>
                        <iframe
                          key={message.id}
                          title={`Email Content ${index}`}
                          srcDoc={createMarkup(message.text).__html}
                          className="w-full border-none"
                          sandbox="allow-same-origin"
                          onLoad={(e) => {
                            console.log("Iframe loaded:", e);
                          }}
                          onError={(e) =>
                            console.error("Iframe load error:", e)
                          }
                          style={{
                            width: "100%",
                            minHeight: "100px", // initial minimum height
                            fontFamily: "inherit !important",
                          }}
                        ></iframe>
                      </div>
                    ) : (
                      <div
                        className={"rounded-xl border p-4 text-sm"}
                        dangerouslySetInnerHTML={{
                          __html: formatPlainTextEmail(
                            extractLatestReply(message.text),
                          ),
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <>
                {mail.messages[0].isHtmlEmail ? (
                  <iframe
                    title="Email Content"
                    srcDoc={createMarkup(mail.messages[0].text).__html}
                    className="h-full w-full border-none"
                    sandbox="allow-same-origin"
                    style={{
                      width: "100%",
                      height: "100%",
                      fontFamily: "inherit !important",
                    }}
                  />
                ) : (
                  <div
                    className="p-4 text-sm"
                    dangerouslySetInnerHTML={{
                      __html: formatPlainTextEmail(mail.messages[0].text),
                    }}
                  />
                )}
              </>
            )}
          </div>
          <Separator className="mt-auto" />
          <div className="p-4">
            <form>
              <div className="grid gap-4">
                <Textarea
                  className="p-4"
                  placeholder={`Reply ${mail.messages[0].name}...`}
                />
                <div className="flex items-center">
                  <Label
                    htmlFor="mute"
                    className="flex items-center gap-2 text-xs font-normal"
                  >
                    <Switch id="mute" aria-label="Mute thread" /> Mute this
                    thread
                  </Label>
                  <Button size="sm" className="ml-auto">
                    Send
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          No message selected
        </div>
      )}
    </div>
  );
}
