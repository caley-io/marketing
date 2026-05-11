"use client";
import * as React from "react";
import {
  Archive,
  ArchiveX,
  Building,
  Calendar,
  CheckCircle,
  File,
  Gauge,
  Inbox as InboxIcon,
  Loader2,
  Newspaper,
  Pencil,
  Plus,
  Send,
  Star,
  Trash2,
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
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useAtom } from "jotai";
import useSWR, { useSWRConfig } from "swr";
import {
  openComposeAtom,
  openCreateWorkspaceOpenAtom,
  selectedWorkspaceIdAtom,
  tabAtom,
  threadsAtom,
} from "@/utils/store";
import { Inbox } from "@/components/mail/components/inbox";
import { Newsletters } from "@/components/mail/components/newsletters";
import { MailStats } from "@/components/mail/components/mail-stats";
import { Button } from "@/components/ui/button";
import { WorkspaceSidebar } from "./workspace-sidebar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SingleImageDropzone } from "@/components/ui/single-image-dropzone";
import { useEdgeStore } from "@/utils/edgestore";
import { ArrowLeftIcon, ArrowRightIcon } from "@radix-ui/react-icons";
import type { WorkspacesResponse } from "@/app/api/workspaces/route";

type InviteRole = "ADMIN" | "USER";

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
  const [file, setFile] = React.useState<File | undefined>();
  const [isUploading, setIsUploading] = React.useState(false);
  const [workspaceName, setWorkspaceName] = React.useState("");
  const [workspaceError, setWorkspaceError] = React.useState<string | null>(
    null,
  );
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<InviteRole>("USER");
  const [selectedTab, setSelectedTab] = useAtom(tabAtom);
  const [, setComposeOpen] = useAtom(openComposeAtom);
  const [stateThreadsData, setStateThreadsData] = useAtom(threadsAtom);
  const [, setSelectedWorkspaceId] = useAtom(selectedWorkspaceIdAtom);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useAtom(
    openCreateWorkspaceOpenAtom,
  );

  const { edgestore } = useEdgeStore();
  const { mutate } = useSWRConfig();

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

  const resetWorkspaceDialog = () => {
    setFile(undefined);
    setWorkspaceName("");
    setInviteEmail("");
    setInviteRole("USER");
    setWorkspaceError(null);
  };

  const createWorkspace = async () => {
    const name = workspaceName.trim();
    if (!name) return;

    try {
      setIsUploading(true);
      setWorkspaceError(null);

      let image: string | null = null;
      if (file) {
        const upload = await edgestore.publicFiles.upload({ file });
        image = upload.url;
      }

      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Could not create workspace");
      }

      let data = (await response.json()) as WorkspacesResponse;
      const createdWorkspace = data.workspaces?.find(
        (workspace: { name: string }) => workspace.name === name,
      );
      const workspaceId = data.workspaceId ?? createdWorkspace?.id;

      if (workspaceId && inviteEmail.trim()) {
        const inviteResponse = await fetch(
          `/api/workspaces/${encodeURIComponent(workspaceId)}/members`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: inviteEmail.trim(),
              role: inviteRole,
            }),
          },
        );

        if (!inviteResponse.ok) {
          const error = await inviteResponse.json();
          throw new Error(error?.error || "Could not invite teammate");
        }

        data = (await inviteResponse.json()) as WorkspacesResponse;
      }

      if (workspaceId) {
        setSelectedWorkspaceId(workspaceId);
        window.localStorage.setItem("caley:selected-workspace", workspaceId);
      }

      await mutate("/api/workspaces", data, { revalidate: false });
      setCreateWorkspaceOpen(false);
      resetWorkspaceDialog();
    } catch (error) {
      setWorkspaceError((error as Error).message);
    } finally {
      setIsUploading(false);
    }
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
        <Dialog
          open={createWorkspaceOpen}
          onOpenChange={(open) => {
            setCreateWorkspaceOpen(open);
            if (!open) resetWorkspaceDialog();
          }}
        >
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle className="pb-2 font-cal text-xl font-bold">
                Create Workspace
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <Label>Logo</Label>
                <SingleImageDropzone
                  className="h-48 w-full"
                  value={file}
                  onChange={(file) => {
                    setFile(file);
                  }}
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label>Name</Label>
                <Input
                  type="text"
                  name="name"
                  value={workspaceName}
                  onChange={(event) => setWorkspaceName(event.target.value)}
                  placeholder="Acme Support"
                />
              </div>
              <div className="grid gap-4 rounded-lg border p-4">
                <div className="flex flex-col space-y-2">
                  <Label>Invite teammate</Label>
                  <Input
                    type="email"
                    name="inviteEmail"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    placeholder="teammate@example.com"
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={inviteRole}
                    onValueChange={(value) =>
                      setInviteRole(value as InviteRole)
                    }
                    disabled={!inviteEmail.trim()}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">Member</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {workspaceError && (
                <p className="text-sm text-destructive">{workspaceError}</p>
              )}
            </div>
            <DialogFooter>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setCreateWorkspaceOpen(false)}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={createWorkspace}
                  disabled={!workspaceName.trim() || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <div
          className={cn(
            isCollapsed &&
              "min-w-[50px] transition-all duration-300 ease-in-out",
            !isCollapsed &&
              "min-w-[300px] transition-all duration-300 ease-in-out",
            "relative border-r",
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
            <div className="absolute bottom-0 right-0 translate-x-8 p-4">
              <div
                className="cursor-pointer rounded-xl border bg-background p-2"
                onClick={(e) => {
                  e.preventDefault();
                  handleOnCollapse();
                }}
              >
                {isCollapsed ? (
                  <ArrowRightIcon className="h-4 w-4" />
                ) : (
                  <ArrowLeftIcon className="h-4 w-4" />
                )}
              </div>
            </div>
          </div>
        </div>
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
