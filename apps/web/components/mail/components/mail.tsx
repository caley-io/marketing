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
  Mail as MailIcon,
  Newspaper,
  Pencil,
  Plus,
  Send,
  Star,
  Trash2,
  UserPlus,
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
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useAtom, useAtomValue } from "jotai";
import useSWR from "swr";
import {
  activeEmailAccountAtom,
  activeWorkspaceIdAtom,
  configAtom,
  openComposeAtom,
  openCreateWorkspaceOpenAtom,
  openWorkspaceSettingsAtom,
  tabAtom,
  threadsAtom,
  WorkspaceItem,
  workspacesAtom,
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
} from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SingleImageDropzone } from "@/components/ui/single-image-dropzone";
import { useEdgeStore } from "@/utils/edgestore";
import { ArrowLeftIcon, ArrowRightIcon } from "@radix-ui/react-icons";
import { WORKSPACE_ROLES, WorkspaceRole } from "@/utils/workspaces";

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
}: MailProps) {
  const { data: workspacesResponse, mutate: mutateWorkspaces } = useSWR<{
    workspaces: WorkspaceItem[];
  }>("/api/workspaces");

  const [workspaces, setWorkspaces] = useAtom(workspacesAtom);
  const [activeWorkspaceId, setActiveWorkspaceId] = useAtom(
    activeWorkspaceIdAtom,
  );
  const [activeEmailAccount, setActiveEmailAccount] = useAtom(
    activeEmailAccountAtom,
  );

  React.useEffect(() => {
    if (workspacesResponse?.workspaces) {
      setWorkspaces(workspacesResponse.workspaces);
      if (
        !activeWorkspaceId &&
        workspacesResponse.workspaces.length > 0
      ) {
        const firstWorkspace = workspacesResponse.workspaces[0];
        setActiveWorkspaceId(firstWorkspace.id);
        if (firstWorkspace.emailAccounts?.[0]?.email) {
          setActiveEmailAccount(firstWorkspace.emailAccounts[0].email);
        }
      }
    }
  }, [
    workspacesResponse,
    activeWorkspaceId,
    setWorkspaces,
    setActiveWorkspaceId,
    setActiveEmailAccount,
  ]);

  const activeWorkspace = React.useMemo(
    () =>
      workspaces.find((ws) => ws.id === activeWorkspaceId) ||
      workspaces[0] ||
      null,
    [workspaces, activeWorkspaceId],
  );

  const switcherAccounts = React.useMemo(() => {
    if (activeWorkspace?.emailAccounts?.length) {
      return activeWorkspace.emailAccounts.map((acc) => ({
        label: acc.name,
        email: acc.email,
        icon: <MailIcon className="h-4 w-4" />,
      }));
    }
    return accounts;
  }, [activeWorkspace, accounts]);

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
  const [initialInviteEmail, setInitialInviteEmail] = React.useState("");
  const [initialInviteRole, setInitialInviteRole] =
    React.useState<WorkspaceRole>("USER");
  const [isUploading, setIsUploading] = React.useState(false);

  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteName, setInviteName] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<WorkspaceRole>("USER");
  const [newAccountLabel, setNewAccountLabel] = React.useState("");
  const [newAccountEmail, setNewAccountEmail] = React.useState("");
  const [settingsStatus, setSettingsStatus] = React.useState<string | null>(
    null,
  );

  const [selectedTab, setSelectedTab] = useAtom(tabAtom);
  const [, setComposeOpen] = useAtom(openComposeAtom);
  const [stateThreadsData, setStateThreadsData] = useAtom(threadsAtom);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useAtom(
    openCreateWorkspaceOpenAtom,
  );
  const [workspaceSettingsOpen, setWorkspaceSettingsOpen] = useAtom(
    openWorkspaceSettingsAtom,
  );

  const { edgestore } = useEdgeStore();

  useAtomValue(configAtom);

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

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) return;
    setIsUploading(true);
    try {
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
          invites: initialInviteEmail.trim()
            ? [
                {
                  email: initialInviteEmail.trim(),
                  role: initialInviteRole,
                },
              ]
            : undefined,
        }),
      });

      if (response.ok) {
        const payload = await response.json();
        await mutateWorkspaces();
        if (payload.workspace?.id) {
          setActiveWorkspaceId(payload.workspace.id);
        }
        setWorkspaceName("");
        setInitialInviteEmail("");
        setFile(undefined);
        setCreateWorkspaceOpen(false);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!activeWorkspace || !inviteEmail.trim()) return;
    setSettingsStatus(null);
    const response = await fetch(
      `/api/workspaces/${activeWorkspace.id}/members`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          name: inviteName.trim() || undefined,
          role: inviteRole,
        }),
      },
    );
    const data = await response.json();
    if (!response.ok) {
      setSettingsStatus(data?.error || "Failed to invite member");
      return;
    }
    setInviteEmail("");
    setInviteName("");
    await mutateWorkspaces();
  };

  const handleRoleChange = async (
    membershipId: string,
    role: WorkspaceRole,
  ) => {
    if (!activeWorkspace) return;
    setSettingsStatus(null);
    const response = await fetch(
      `/api/workspaces/${activeWorkspace.id}/members`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId, role }),
      },
    );
    if (!response.ok) {
      const data = await response.json();
      setSettingsStatus(data?.error || "Failed to update role");
      return;
    }
    await mutateWorkspaces();
  };

  const handleRemoveMember = async (membershipId: string) => {
    if (!activeWorkspace) return;
    setSettingsStatus(null);
    const response = await fetch(
      `/api/workspaces/${activeWorkspace.id}/members?membershipId=${encodeURIComponent(
        membershipId,
      )}`,
      {
        method: "DELETE",
      },
    );
    if (!response.ok) {
      const data = await response.json();
      setSettingsStatus(data?.error || "Failed to remove member");
      return;
    }
    await mutateWorkspaces();
  };

  const handleAddEmailAccount = async () => {
    if (!activeWorkspace || !newAccountLabel.trim() || !newAccountEmail.trim())
      return;
    setSettingsStatus(null);
    const response = await fetch(
      `/api/workspaces/${activeWorkspace.id}/accounts`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAccountLabel.trim(),
          email: newAccountEmail.trim(),
        }),
      },
    );
    const data = await response.json();
    if (!response.ok) {
      setSettingsStatus(data?.error || "Failed to connect email account");
      return;
    }
    setNewAccountLabel("");
    setNewAccountEmail("");
    setActiveEmailAccount(data.account.email);
    await mutateWorkspaces();
  };

  const handleRemoveEmailAccount = async (accountId: string) => {
    if (!activeWorkspace) return;
    setSettingsStatus(null);
    const response = await fetch(
      `/api/workspaces/${activeWorkspace.id}/accounts?accountId=${encodeURIComponent(
        accountId,
      )}`,
      {
        method: "DELETE",
      },
    );
    if (!response.ok) {
      const data = await response.json();
      setSettingsStatus(data?.error || "Failed to remove email account");
      return;
    }
    await mutateWorkspaces();
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
                  placeholder="Acme Marketing"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 flex flex-col space-y-2">
                  <Label>Invite Teammate (optional)</Label>
                  <Input
                    type="email"
                    name="inviteEmail"
                    placeholder="teammate@company.com"
                    value={initialInviteEmail}
                    onChange={(e) => setInitialInviteEmail(e.target.value)}
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <Label>Role</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={initialInviteRole}
                    onChange={(e) =>
                      setInitialInviteRole(e.target.value as WorkspaceRole)
                    }
                  >
                    {WORKSPACE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
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
                  disabled={isUploading || !workspaceName.trim()}
                  onClick={handleCreateWorkspace}
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
          open={workspaceSettingsOpen}
          onOpenChange={() => setWorkspaceSettingsOpen(!workspaceSettingsOpen)}
        >
          <DialogContent className="sm:max-w-[680px]">
            <DialogHeader>
              <DialogTitle className="pb-2 font-cal text-xl font-bold">
                {activeWorkspace?.name || "Workspace"} — Team & Email Accounts
              </DialogTitle>
            </DialogHeader>
            {settingsStatus && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {settingsStatus}
              </div>
            )}
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Team Members</Label>
                <div className="grid grid-cols-4 gap-2">
                  <Input
                    placeholder="Name (optional)"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                  />
                  <Input
                    placeholder="teammate@company.com"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={inviteRole}
                    onChange={(e) =>
                      setInviteRole(e.target.value as WorkspaceRole)
                    }
                  >
                    {WORKSPACE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <Button onClick={handleInviteMember}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite
                  </Button>
                </div>
                <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-2">
                  {(activeWorkspace?.membership || []).map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div>
                        <span className="font-medium">
                          {member.user?.name ||
                            member.invitedName ||
                            member.user?.email ||
                            member.invitedEmail}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {member.user?.email ||
                            `${member.invitedEmail} (Pending)`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          className="h-8 rounded border bg-background px-2 text-xs"
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(
                              member.id,
                              e.target.value as WorkspaceRole,
                            )
                          }
                        >
                          {WORKSPACE_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-sm font-semibold">
                  Connected Gmail / Google Workspace Accounts
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Account label (e.g. Sales)"
                    value={newAccountLabel}
                    onChange={(e) => setNewAccountLabel(e.target.value)}
                  />
                  <Input
                    placeholder="sales@company.com"
                    type="email"
                    value={newAccountEmail}
                    onChange={(e) => setNewAccountEmail(e.target.value)}
                  />
                  <Button onClick={handleAddEmailAccount}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Account
                  </Button>
                </div>
                <div className="max-h-36 space-y-2 overflow-y-auto rounded-md border p-2">
                  {(activeWorkspace?.emailAccounts || []).map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div>
                        <span className="font-medium">{acc.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {acc.email}
                        </span>
                        {activeEmailAccount === acc.email && (
                          <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            Active
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveEmailAccount(acc.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
              accounts={switcherAccounts}
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
