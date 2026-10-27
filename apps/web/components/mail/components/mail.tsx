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
  activeWorkspaceIdAtom,
  configAtom,
  openComposeAtom,
  openCreateWorkspaceOpenAtom,
  openWorkspaceManageAtom,
  tabAtom,
  threadsAtom,
} from "@/utils/store";
import { ProfileDropdown } from "@/components/TopNav";
import { Inbox } from "@/components/mail/components/inbox";
import { Newsletters } from "@/components/mail/components/newsletters";
import { MailStats } from "@/components/mail/components/mail-stats";
import { Button, ButtonLoader } from "@/components/ui/button";
import { WorkspaceSidebar, WorkspaceSummary } from "./workspace-sidebar";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SingleImageDropzone } from "@/components/ui/single-image-dropzone";
import { useEdgeStore } from "@/utils/edgestore";
import { ArrowLeftIcon, ArrowRightIcon } from "@radix-ui/react-icons";

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
  const [workspaceName, setWorkspaceName] = React.useState("");
  const [workspaceDescription, setWorkspaceDescription] = React.useState("");
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteName, setInviteName] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<"OWNER" | "ADMIN" | "USER">("USER");
  const [newAccountEmail, setNewAccountEmail] = React.useState("");
  const [newAccountName, setNewAccountName] = React.useState("");
  const [isSubmittingManage, setIsSubmittingManage] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [selectedTab, setSelectedTab] = useAtom(tabAtom);
  const [composeOpen, setComposeOpen] = useAtom(openComposeAtom);
  const [stateThreadsData, setStateThreadsData] = useAtom(threadsAtom);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useAtom(
    openCreateWorkspaceOpenAtom,
  );
  const [activeWorkspaceId, setActiveWorkspaceId] = useAtom(
    activeWorkspaceIdAtom,
  );
  const [workspaceManageOpen, setWorkspaceManageOpen] = useAtom(
    openWorkspaceManageAtom,
  );

  const { data: workspacesData, mutate: mutateWorkspaces } = useSWR<{
    workspaces: WorkspaceSummary[];
  }>("/api/workspaces");

  const activeWorkspace = React.useMemo(
    () =>
      workspacesData?.workspaces?.find((ws) => ws.id === activeWorkspaceId) ??
      workspacesData?.workspaces?.[0] ??
      null,
    [workspacesData, activeWorkspaceId],
  );

  const displayedAccounts = React.useMemo(() => {
    if (
      activeWorkspace?.emailAccounts &&
      activeWorkspace.emailAccounts.length > 0
    ) {
      return activeWorkspace.emailAccounts.map((acc) => ({
        label: acc.name || acc.email,
        email: acc.email,
        icon: <InboxIcon className="h-4 w-4" />,
      }));
    }
    return accounts;
  }, [activeWorkspace, accounts]);

  const { edgestore } = useEdgeStore();

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
        <Dialog
          open={createWorkspaceOpen}
          onOpenChange={() => setCreateWorkspaceOpen(!createWorkspaceOpen)}
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
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="Acme Marketing"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label>Description</Label>
                <Input
                  type="text"
                  name="description"
                  value={workspaceDescription}
                  onChange={(e) => setWorkspaceDescription(e.target.value)}
                  placeholder="Team shared inbox and outreach workspace"
                />
              </div>
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
                  disabled={!workspaceName.trim() || isUploading}
                  onClick={async () => {
                    try {
                      setIsUploading(true);
                      let uploadedImageUrl: string | undefined;
                      if (file) {
                        const res = await edgestore.publicFiles.upload({
                          file,
                        });
                        uploadedImageUrl = res.url;
                      }

                      const response = await fetch("/api/workspaces", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          name: workspaceName.trim(),
                          image: uploadedImageUrl,
                        }),
                      });

                      const result = await response.json();
                      if (!response.ok) {
                        toast.error(
                          result?.error || "Failed to create workspace",
                        );
                        return;
                      }

                      await mutateWorkspaces();
                      if (result?.workspace?.id) {
                        setActiveWorkspaceId(result.workspace.id);
                      }
                      setWorkspaceName("");
                      setWorkspaceDescription("");
                      setFile(undefined);
                      setCreateWorkspaceOpen(false);
                      toast.success("Workspace created");
                    } catch {
                      toast.error("Failed to create workspace");
                    } finally {
                      setIsUploading(false);
                    }
                  }}
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

        <Dialog
          open={workspaceManageOpen}
          onOpenChange={() => setWorkspaceManageOpen(!workspaceManageOpen)}
        >
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle className="pb-2 font-cal text-xl font-bold">
                {activeWorkspace
                  ? `${activeWorkspace.name} — Team & Gmail Accounts`
                  : "Workspace Settings"}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Invite team members with role-based permissions and attach
                multiple Gmail accounts to this workspace.
              </DialogDescription>
            </DialogHeader>

            {activeWorkspace && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="font-semibold">Team Members</Label>
                  <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border p-2 text-sm">
                    {(activeWorkspace.membership ?? []).map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between py-1"
                      >
                        <span>
                          {member.user?.email ||
                            member.invitedEmail ||
                            member.user?.name ||
                            member.invitedName}
                        </span>
                        <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                          {member.role}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <Input
                      type="email"
                      placeholder="teammate@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                    <Input
                      type="text"
                      placeholder="Name (optional)"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                    />
                    <div className="flex space-x-2">
                      <select
                        aria-label="Member role"
                        className="rounded-md border bg-background px-2 py-1 text-sm"
                        value={inviteRole}
                        onChange={(e) =>
                          setInviteRole(
                            e.target.value as "OWNER" | "ADMIN" | "USER",
                          )
                        }
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="OWNER">OWNER</option>
                      </select>
                      <Button
                        size="sm"
                        disabled={!inviteEmail.trim() || isSubmittingManage}
                        onClick={async () => {
                          try {
                            setIsSubmittingManage(true);
                            const res = await fetch(
                              `/api/workspaces/${activeWorkspace.id}/members`,
                              {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  email: inviteEmail.trim(),
                                  name: inviteName.trim() || undefined,
                                  role: inviteRole,
                                }),
                              },
                            );
                            const data = await res.json();
                            if (!res.ok) {
                              toast.error(
                                data?.error || "Failed to invite member",
                              );
                              return;
                            }
                            await mutateWorkspaces();
                            setInviteEmail("");
                            setInviteName("");
                            toast.success("Team member added");
                          } finally {
                            setIsSubmittingManage(false);
                          }
                        }}
                      >
                        Invite
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="font-semibold">
                    Workspace Email Accounts
                  </Label>
                  <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border p-2 text-sm">
                    {(activeWorkspace.emailAccounts ?? []).length === 0 ? (
                      <div className="text-muted-foreground">
                        No workspace email accounts linked yet.
                      </div>
                    ) : (
                      (activeWorkspace.emailAccounts ?? []).map((acc) => (
                        <div
                          key={acc.id}
                          className="flex items-center justify-between py-1"
                        >
                          <span>{acc.email}</span>
                          <span className="text-xs text-muted-foreground">
                            {acc.name || "Gmail"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <Input
                      type="email"
                      placeholder="inbox@company.com"
                      value={newAccountEmail}
                      onChange={(e) => setNewAccountEmail(e.target.value)}
                    />
                    <Input
                      type="text"
                      placeholder="Account label"
                      value={newAccountName}
                      onChange={(e) => setNewAccountName(e.target.value)}
                    />
                    <Button
                      size="sm"
                      disabled={!newAccountEmail.trim() || isSubmittingManage}
                      onClick={async () => {
                        try {
                          setIsSubmittingManage(true);
                          const res = await fetch(
                            `/api/workspaces/${activeWorkspace.id}/accounts`,
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                email: newAccountEmail.trim(),
                                name: newAccountName.trim() || undefined,
                              }),
                            },
                          );
                          const data = await res.json();
                          if (!res.ok) {
                            toast.error(
                              data?.error || "Failed to link email account",
                            );
                            return;
                          }
                          await mutateWorkspaces();
                          setNewAccountEmail("");
                          setNewAccountName("");
                          toast.success("Email account linked to workspace");
                        } finally {
                          setIsSubmittingManage(false);
                        }
                      }}
                    >
                      Add Account
                    </Button>
                  </div>
                </div>
              </div>
            )}
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
            <AccountSwitcher
              isCollapsed={isCollapsed}
              accounts={displayedAccounts}
            />
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
