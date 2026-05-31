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
  Settings2,
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
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useAtom } from "jotai";
import useSWR from "swr";
import {
  openComposeAtom,
  openCreateWorkspaceOpenAtom,
  selectedEmailAccountIdAtom,
  selectedWorkspaceIdAtom,
  tabAtom,
  threadsAtom,
} from "@/utils/store";
import type {
  WorkspaceMember,
  WorkspaceSummary,
} from "@/utils/workspace-types";
import { Inbox } from "@/components/mail/components/inbox";
import { Newsletters } from "@/components/mail/components/newsletters";
import { MailStats } from "@/components/mail/components/mail-stats";
import { Button, ButtonLoader } from "@/components/ui/button";
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
import { SingleImageDropzone } from "@/components/ui/single-image-dropzone";
import { useEdgeStore } from "@/utils/edgestore";
import { ArrowLeftIcon, ArrowRightIcon } from "@radix-ui/react-icons";

type Role = "OWNER" | "ADMIN" | "USER";

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
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useAtom(
    selectedWorkspaceIdAtom,
  );
  const [selectedEmailAccountId, setSelectedEmailAccountId] = useAtom(
    selectedEmailAccountIdAtom,
  );
  const { data: workspacesData, mutate: mutateWorkspaces } = useSWR<{
    workspaces: WorkspaceSummary[];
  }>("/api/workspaces", {
    keepPreviousData: true,
  });
  const workspaces = React.useMemo(
    () => workspacesData?.workspaces ?? [],
    [workspacesData],
  );
  const selectedWorkspace =
    workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ??
    null;
  const selectedWorkspaceHasAccount = selectedWorkspace?.emailAccounts.some(
    (account) => account.id === selectedEmailAccountId,
  );
  const workspaceQuery = React.useMemo(() => {
    const params = new URLSearchParams();
    if (selectedWorkspaceId) params.set("workspaceId", selectedWorkspaceId);
    if (selectedWorkspaceId && selectedEmailAccountId) {
      params.set("emailAccountId", selectedEmailAccountId);
    }
    return params;
  }, [selectedEmailAccountId, selectedWorkspaceId]);
  const threadsUrl = React.useCallback(
    (filters: Record<string, string | boolean> = {}) => {
      const params = new URLSearchParams(workspaceQuery);
      Object.entries(filters).forEach(([key, value]) => {
        params.set(key, String(value));
      });
      const query = params.toString();
      return `/api/google/threads${query ? `?${query}` : ""}`;
    },
    [workspaceQuery],
  );

  const {
    data: threadsData,
    error: threadsError,
    isLoading: threadsLoading,
  } = useSWR(threadsUrl(), {
    keepPreviousData: true,
  });

  const {
    data: doneEmailsData,
    error: doneEmailsError,
    isLoading: doneEmailsLoading,
  } = useSWR(threadsUrl({ isDone: true }), {
    keepPreviousData: true,
  });

  const {
    data: teamEmailsData,
    error: teamEmailsError,
    isLoading: teamEmailsLoading,
  } = useSWR(threadsUrl({ isTeam: true }), {
    keepPreviousData: true,
  });

  const {
    data: calendarEmailsData,
    error: calendarEmailsError,
    isLoading: calendarEmailsLoading,
  } = useSWR(threadsUrl({ isCalendar: true }), {
    keepPreviousData: true,
  });

  const {
    data: sentEmailsData,
    error: sentEmailsError,
    isLoading: sentEmailsLoading,
  } = useSWR(threadsUrl({ isSent: true }), {
    keepPreviousData: true,
  });

  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const [file, setFile] = React.useState<File | undefined>();
  const [isUploading, setIsUploading] = React.useState(false);
  const [workspaceName, setWorkspaceName] = React.useState("");
  const [workspaceError, setWorkspaceError] = React.useState<string | null>(
    null,
  );
  const [manageWorkspaceOpen, setManageWorkspaceOpen] = React.useState(false);
  const [settingsName, setSettingsName] = React.useState("");
  const [settingsImage, setSettingsImage] = React.useState("");
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteName, setInviteName] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<Role>("USER");
  const [isSavingWorkspace, setIsSavingWorkspace] = React.useState(false);
  const [selectedTab, setSelectedTab] = useAtom(tabAtom);
  const [, setComposeOpen] = useAtom(openComposeAtom);
  const [, setStateThreadsData] = useAtom(threadsAtom);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useAtom(
    openCreateWorkspaceOpenAtom,
  );

  const { edgestore } = useEdgeStore();

  const workspaceAccounts = React.useMemo(() => {
    if (!selectedWorkspace) return accounts;

    return selectedWorkspace.emailAccounts.map((account) => ({
      id: account.id,
      label: account.name,
      email: account.email,
      icon: <Users2 className="h-4 w-4" />,
    }));
  }, [accounts, selectedWorkspace]);

  React.useEffect(() => {
    if (!workspacesData) return;
    if (!workspaces.length) {
      setSelectedWorkspaceId(null);
      return;
    }

    if (
      !selectedWorkspaceId ||
      !workspaces.some((workspace) => workspace.id === selectedWorkspaceId)
    ) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [selectedWorkspaceId, setSelectedWorkspaceId, workspaces, workspacesData]);

  React.useEffect(() => {
    if (!selectedWorkspace) {
      setSelectedEmailAccountId(null);
      return;
    }

    const firstAccountId = selectedWorkspace.emailAccounts[0]?.id ?? null;
    if (!selectedEmailAccountId || !selectedWorkspaceHasAccount) {
      setSelectedEmailAccountId(firstAccountId);
    }
  }, [
    selectedEmailAccountId,
    selectedWorkspace,
    selectedWorkspaceHasAccount,
    setSelectedEmailAccountId,
  ]);

  React.useEffect(() => {
    if (!selectedWorkspace) return;
    setSettingsName(selectedWorkspace.name);
    setSettingsImage(selectedWorkspace.image || "");
  }, [selectedWorkspace]);

  React.useEffect(() => {
    if (threadsData) setStateThreadsData(threadsData);
  }, [threadsData, setStateThreadsData]);

  const handleOnCollapse = () => {
    document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
      !isCollapsed,
    )}`;
    setIsCollapsed(!isCollapsed);
  };

  async function refreshWorkspaces() {
    await mutateWorkspaces();
  }

  async function handleCreateWorkspace() {
    setWorkspaceError(null);
    if (!workspaceName.trim()) {
      setWorkspaceError("Workspace name is required.");
      return;
    }

    try {
      setIsUploading(true);
      let image: string | undefined;

      if (file) {
        const res = await edgestore.publicFiles.upload({ file });
        image = res.url;
      }

      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName, image }),
      });

      if (!response.ok) throw new Error("Could not create workspace");

      const result = await response.json();
      await refreshWorkspaces();
      setSelectedWorkspaceId(result.workspace.id);
      setSelectedEmailAccountId(result.workspace.emailAccounts[0]?.id ?? null);
      setWorkspaceName("");
      setFile(undefined);
      setCreateWorkspaceOpen(false);
    } catch (error) {
      setWorkspaceError(
        error instanceof Error ? error.message : "Could not create workspace.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleUpdateWorkspace() {
    if (!selectedWorkspace) return;
    setWorkspaceError(null);
    setIsSavingWorkspace(true);

    try {
      const response = await fetch(`/api/workspaces/${selectedWorkspace.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: settingsName,
          image: settingsImage || null,
        }),
      });
      if (!response.ok) throw new Error("Could not update workspace");
      await refreshWorkspaces();
    } catch (error) {
      setWorkspaceError(
        error instanceof Error ? error.message : "Could not update workspace.",
      );
    } finally {
      setIsSavingWorkspace(false);
    }
  }

  async function handleAddCurrentAccount() {
    if (!selectedWorkspace) return;
    setWorkspaceError(null);

    try {
      const response = await fetch(
        `/api/workspaces/${selectedWorkspace.id}/email-accounts`,
        { method: "POST" },
      );
      if (!response.ok) throw new Error("Could not add account");
      await refreshWorkspaces();
    } catch (error) {
      setWorkspaceError(
        error instanceof Error ? error.message : "Could not add account.",
      );
    }
  }

  async function handleInviteMember() {
    if (!selectedWorkspace || !inviteEmail.trim()) return;
    setWorkspaceError(null);

    try {
      const response = await fetch(
        `/api/workspaces/${selectedWorkspace.id}/members`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: inviteEmail,
            name: inviteName,
            role: inviteRole,
          }),
        },
      );
      if (!response.ok) throw new Error("Could not invite member");
      await refreshWorkspaces();
      setInviteEmail("");
      setInviteName("");
      setInviteRole("USER");
    } catch (error) {
      setWorkspaceError(
        error instanceof Error ? error.message : "Could not invite member.",
      );
    }
  }

  async function handleUpdateMember(member: WorkspaceMember, role: Role) {
    if (!selectedWorkspace) return;
    await fetch(
      `/api/workspaces/${selectedWorkspace.id}/members/${member.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      },
    );
    await refreshWorkspaces();
  }

  async function handleRemoveMember(member: WorkspaceMember) {
    if (!selectedWorkspace) return;
    await fetch(
      `/api/workspaces/${selectedWorkspace.id}/members/${member.id}`,
      { method: "DELETE" },
    );
    await refreshWorkspaces();
  }

  async function handleRemoveEmailAccount(emailAccountId: string) {
    if (!selectedWorkspace) return;
    await fetch(
      `/api/workspaces/${selectedWorkspace.id}/email-accounts/${emailAccountId}`,
      { method: "DELETE" },
    );
    if (selectedEmailAccountId === emailAccountId)
      setSelectedEmailAccountId(null);
    await refreshWorkspaces();
  }

  const returnTab = () => {
    switch (selectedTab) {
      case "Inbox":
        return (
          <Inbox
            data={threadsData}
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
        <WorkspaceSidebar
          workspaces={workspaces}
          selectedWorkspaceId={selectedWorkspaceId}
          onSelectWorkspace={setSelectedWorkspaceId}
        />
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
                  onChange={setFile}
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label>Name</Label>
                <Input
                  type="text"
                  value={workspaceName}
                  onChange={(event) => setWorkspaceName(event.target.value)}
                />
              </div>
              {workspaceError && (
                <div className="text-sm text-destructive">{workspaceError}</div>
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
                <Button onClick={handleCreateWorkspace} disabled={isUploading}>
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
          open={manageWorkspaceOpen}
          onOpenChange={() => setManageWorkspaceOpen(!manageWorkspaceOpen)}
        >
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]">
            <DialogHeader>
              <DialogTitle className="pb-2 font-cal text-xl font-bold">
                Workspace
              </DialogTitle>
            </DialogHeader>
            {selectedWorkspace && (
              <div className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={settingsName}
                      onChange={(event) => setSettingsName(event.target.value)}
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Label>Logo URL</Label>
                    <Input
                      value={settingsImage}
                      onChange={(event) => setSettingsImage(event.target.value)}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleUpdateWorkspace}
                  disabled={isSavingWorkspace}
                >
                  {isSavingWorkspace && <ButtonLoader />}
                  Save
                </Button>
                <Separator />
                <div className="space-y-3">
                  <div className="font-medium">Accounts</div>
                  {selectedWorkspace.emailAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between gap-3 rounded-md border p-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {account.name}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {account.email}
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRemoveEmailAccount(account.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={handleAddCurrentAccount}>
                    Add current Google account
                  </Button>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="font-medium">Team</div>
                  <div className="grid gap-3 sm:grid-cols-[1fr_1fr_120px_auto]">
                    <Input
                      placeholder="email@company.com"
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.target.value)}
                    />
                    <Input
                      placeholder="Name"
                      value={inviteName}
                      onChange={(event) => setInviteName(event.target.value)}
                    />
                    <select
                      className="h-9 rounded-md border bg-background px-3 text-sm"
                      value={inviteRole}
                      onChange={(event) =>
                        setInviteRole(event.target.value as Role)
                      }
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <Button onClick={handleInviteMember}>Invite</Button>
                  </div>
                  {selectedWorkspace.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between gap-3 rounded-md border p-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {member.user?.name ||
                            member.invitedName ||
                            member.user?.email ||
                            member.invitedEmail}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {member.user?.email || member.invitedEmail}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          className="h-9 rounded-md border bg-background px-3 text-sm"
                          value={member.role}
                          onChange={(event) =>
                            handleUpdateMember(
                              member,
                              event.target.value as Role,
                            )
                          }
                        >
                          <option value="OWNER">Owner</option>
                          <option value="ADMIN">Admin</option>
                          <option value="USER">User</option>
                        </select>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRemoveMember(member)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {workspaceError && (
                  <div className="text-sm text-destructive">
                    {workspaceError}
                  </div>
                )}
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
              "flex h-[52px] items-center gap-2 px-2",
              isCollapsed && "h-[52px] justify-center px-1",
            )}
          >
            {workspaceAccounts.length ? (
              <AccountSwitcher
                isCollapsed={isCollapsed}
                accounts={workspaceAccounts}
                selectedAccountId={
                  selectedWorkspace ? selectedEmailAccountId : undefined
                }
                onSelectAccount={
                  selectedWorkspace ? setSelectedEmailAccountId : undefined
                }
              />
            ) : (
              <div className="truncate text-xs text-muted-foreground">
                No accounts
              </div>
            )}
            {!isCollapsed && selectedWorkspace && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setManageWorkspaceOpen(true)}
              >
                <Settings2 className="h-4 w-4" />
                <span className="sr-only">Workspace settings</span>
              </Button>
            )}
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
