"use client";
import * as React from "react";
import {
  AlertCircle,
  Archive,
  ArchiveX,
  Building,
  Calendar,
  CheckCircle,
  File,
  Gauge,
  Inbox as InboxIcon,
  Loader2,
  MessagesSquare,
  Newspaper,
  Pencil,
  Plus,
  Send,
  ShoppingCart,
  Star,
  Trash2,
  Users2,
} from "lucide-react";

import { AccountSwitcher } from "./account-switcher";
import { Nav } from "./nav";
import { cn } from "@/utils";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import useSWR from "swr";
import {
  configAtom,
  openComposeAtom,
  tabAtom,
  threadsAtom,
} from "@/utils/store";
import { ProfileDropdown } from "@/components/TopNav";
import { Inbox } from "@/components/mail/components/inbox";
import { Newsletters } from "@/components/mail/components/newsletters";
import { MailStats } from "@/components/mail/components/mail-stats";
import { Button, ButtonLoader } from "@/components/ui/button";
import { WorkspaceSidebar } from "./workspace-sidebar";

interface MailProps {
  accounts: {
    label: string;
    email: string;
    icon: React.ReactNode;
  }[];
  defaultLayout: number[] | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
}

export function Mail({
  accounts,
  defaultLayout = [225, 440, 655],
  defaultCollapsed = false,
  navCollapsedSize,
}: MailProps) {
  const {
    data: threadsData,
    error: threadsError,
    isLoading: threadsLoading,
  } = useSWR("/api/google/threads", {
    keepPreviousData: true,
  });

  const {
    data: doneEmailsData,
    error: doneEmailsError,
    isLoading: doneEmailsLoading,
  } = useSWR("/api/google/threads?isDone=true", {
    keepPreviousData: true,
  });

  const {
    data: teamEmailsData,
    error: teamEmailsError,
    isLoading: teamEmailsLoading,
  } = useSWR("/api/google/threads?isTeam=true", {
    keepPreviousData: true,
  });

  const {
    data: calendarEmailsData,
    error: calendarEmailsError,
    isLoading: calendarEmailsLoading,
  } = useSWR("/api/google/threads?isCalendar=true", {
    keepPreviousData: true,
  });

  const {
    data: sentEmailsData,
    error: sentEmailsError,
    isLoading: sentEmailsLoading,
  } = useSWR("/api/google/threads?isSent=true", {
    keepPreviousData: true,
  });

  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const [selectedTab, setSelectedTab] = useAtom(tabAtom);
  const [composeOpen, setComposeOpen] = useAtom(openComposeAtom);
  const [stateThreadsData, setStateThreadsData] = useAtom(threadsAtom);

  const mail = useAtomValue(configAtom);

  React.useEffect(() => {
    if (threadsData) {
      setStateThreadsData(threadsData);
    }
  }, [threadsData, setStateThreadsData]);

  const handleOnCollapse = () => {
    document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
      !isCollapsed,
    )}`;
    setIsCollapsed(!isCollapsed);
  };

  const returnTab = () => {
    switch (selectedTab) {
      case "Inbox":
        return (
          <Inbox
            data={stateThreadsData}
            isLoading={threadsLoading}
            error={threadsError}
            defaultLayout={defaultLayout}
          />
        );
      case "Newsletters":
        return <Newsletters />;
      case "Analytics":
        return <MailStats />;
      case "Drafts":
        return (
          <ResizablePanel defaultSize={1095} className="h-screen">
            <div>Draft</div>
          </ResizablePanel>
        );
      case "Sent":
        return (
          <Inbox
            data={sentEmailsData}
            isLoading={sentEmailsLoading}
            error={sentEmailsError}
            defaultLayout={defaultLayout}
          />
        );
      case "Junk":
        return (
          <ResizablePanel defaultSize={1095} className="h-screen">
            <div>Junk</div>
          </ResizablePanel>
        );
      case "Trash":
        return (
          <ResizablePanel defaultSize={1095} className="h-screen">
            <div>Trash</div>
          </ResizablePanel>
        );
      case "Archive":
        return (
          <ResizablePanel defaultSize={1095} className="h-screen">
            <div>Archive</div>
          </ResizablePanel>
        );
      case "Done":
        return (
          <Inbox
            data={doneEmailsData}
            isLoading={doneEmailsLoading}
            error={doneEmailsError}
            defaultLayout={defaultLayout}
          />
        );
      case "Team":
        return (
          <Inbox
            data={teamEmailsData}
            isLoading={teamEmailsLoading}
            error={teamEmailsError}
            defaultLayout={defaultLayout}
          />
        );
      case "Calendar":
        return (
          <Inbox
            data={calendarEmailsData}
            isLoading={calendarEmailsLoading}
            error={calendarEmailsError}
            defaultLayout={defaultLayout}
          />
        );
      case "VIP":
        return (
          <ResizablePanel defaultSize={1095} className="h-screen">
            <div>Shopping</div>
          </ResizablePanel>
        );
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes: number[]) => {
          document.cookie = `react-resizable-panels:layout=${JSON.stringify(
            sizes,
          )}`;
        }}
      >
        <WorkspaceSidebar />
        <ResizablePanel
          defaultSize={defaultLayout[0]}
          collapsedSize={navCollapsedSize}
          collapsible={true}
          minSize={15}
          maxSize={20}
          onCollapse={handleOnCollapse}
          className={cn(
            isCollapsed &&
              "min-w-[50px] transition-all duration-300 ease-in-out",
          )}
        >
          <div
            className={cn(
              "flex h-[52px] items-center justify-center",
              isCollapsed ? "h-[52px] flex-col" : "px-2",
            )}
          >
            <AccountSwitcher isCollapsed={isCollapsed} accounts={accounts} />
          </div>
          <Separator />
          <div className="flex h-[calc(100vh-52px)] flex-col justify-between">
            <div>
              <Nav
                isCollapsed={isCollapsed}
                selectedTab={selectedTab}
                setSelectedTab={setSelectedTab}
                links={[
                  {
                    title: "Inbox",
                    label: threadsData?.threads.length || "0",
                    icon: InboxIcon,
                    variant: "default",
                  },
                  {
                    title: "Newsletters",
                    label: "12",
                    icon: Newspaper,
                    variant: "ghost",
                  },
                  {
                    title: "Analytics",
                    label: "",
                    icon: Gauge,
                    variant: "ghost",
                  },
                  {
                    title: "Done",
                    label: doneEmailsData?.threads.length || "0",
                    icon: CheckCircle,
                    variant: "ghost",
                  },
                  {
                    title: "Team",
                    label: teamEmailsData?.threads.length || "0",
                    icon: Building,
                    variant: "ghost",
                  },
                  {
                    title: "Calendar",
                    label: calendarEmailsData?.threads.length || "0",
                    icon: Calendar,
                    variant: "ghost",
                  },
                  {
                    title: "VIP",
                    label: "8",
                    icon: Star,
                    variant: "ghost",
                  },
                ]}
              />
              <Separator />
              <Nav
                isCollapsed={isCollapsed}
                selectedTab={selectedTab}
                setSelectedTab={setSelectedTab}
                links={[
                  {
                    title: "Drafts",
                    label: "9",
                    icon: File,
                    variant: "ghost",
                  },
                  {
                    title: "Sent",
                    label: sentEmailsData?.threads.length || "0",
                    icon: Send,
                    variant: "ghost",
                  },
                  {
                    title: "Junk",
                    label: "23",
                    icon: ArchiveX,
                    variant: "ghost",
                  },
                  {
                    title: "Trash",
                    label: "",
                    icon: Trash2,
                    variant: "ghost",
                  },
                  {
                    title: "Archive",
                    label: "",
                    icon: Archive,
                    variant: "ghost",
                  },
                ]}
              />

              <div
                data-collapsed={isCollapsed}
                className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2"
              >
                <div className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
                  {isCollapsed ? (
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            setComposeOpen(true);
                          }}
                          size={"icon"}
                          variant={"default"}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Compose</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="flex items-center gap-4"
                      >
                        Compose
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <div className="p-4">
                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          setComposeOpen(true);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Compose
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        {returnTab()}
      </ResizablePanelGroup>
    </TooltipProvider>
  );
}

export function DataDisplayComponent({
  isLoading,
  error,
  data,
  renderContent,
}: {
  isLoading: boolean;
  error: any;
  data: any;
  renderContent: (data: any) => React.ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Error: {error.message}
      </div>
    );
  }

  if (!data || data.threads.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No emails available
      </div>
    );
  }

  return renderContent(data);
}
