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
import useSWR, { useSWRConfig } from "swr";
import {
  configAtom,
  openComposeAtom,
  openCreateWorkspaceOpenAtom,
  tabAtom,
  threadsAtom,
} from "@/utils/store";
import { ProfileDropdown } from "@/components/TopNav";
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

interface WorkspaceResponse {
  workspaces: {
    id: string;
    name: string;
    members: {
      id: string;
      role: "OWNER" | "ADMIN" | "USER";
      invitedName: string | null;
      invitedEmail: string | null;
      user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
      } | null;
    }[];
    emailAccounts: {
      id: string;
      name: string;
      email: string;
    }[];
  }[];
}

type WorkspaceEmailAccountDraft = {
  name: string;
  email: string;
};

type InvitedMemberDraft = {
  name: string;
  email: string;
  role: "ADMIN" | "USER";
};

export function Mail({
  accounts,
  defaultLayout = [225, 440, 655],
  defaultCollapsed = false,
  navCollapsedSize,
}: MailProps) {
  const { data: workspacesData } =
    useSWR<WorkspaceResponse>("/api/workspaces");

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
  const [emailAccountDrafts, setEmailAccountDrafts] = React.useState<
    WorkspaceEmailAccountDraft[]
  >([{ name: "", email: "" }]);
  const [invitedMemberDrafts, setInvitedMemberDrafts] = React.useState<
    InvitedMemberDraft[]
  >([{ name: "", email: "", role: "USER" }]);
  const [workspaceError, setWorkspaceError] = React.useState<string | null>(
    null,
  );
  const [selectedTab, setSelectedTab] = useAtom(tabAtom);
  const [composeOpen, setComposeOpen] = useAtom(openComposeAtom);
  const [stateThreadsData, setStateThreadsData] = useAtom(threadsAtom);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useAtom(
    openCreateWorkspaceOpenAtom,
  );

  const { edgestore } = useEdgeStore();
  const { mutate } = useSWRConfig();

  const mail = useAtomValue(configAtom);

  const workspaceAccounts =
    workspacesData?.workspaces.flatMap((workspace) =>
      workspace.emailAccounts.map((emailAccount) => ({
        label: emailAccount.name || workspace.name,
        email: emailAccount.email,
        icon: <MessagesSquare className="h-4 w-4" />,
      })),
    ) ?? [];
  const visibleAccounts = workspaceAccounts.length
    ? workspaceAccounts
    : accounts;
  const updateEmailAccountDraft = (
    index: number,
    updates: Partial<WorkspaceEmailAccountDraft>,
  ) => {
    setEmailAccountDrafts((drafts) =>
      drafts.map((draft, draftIndex) =>
        draftIndex === index ? { ...draft, ...updates } : draft,
      ),
    );
    setWorkspaceError(null);
  };
  const updateInvitedMemberDraft = (
    index: number,
    updates: Partial<InvitedMemberDraft>,
  ) => {
    setInvitedMemberDrafts((drafts) =>
      drafts.map((draft, draftIndex) =>
        draftIndex === index ? { ...draft, ...updates } : draft,
      ),
    );
    setWorkspaceError(null);
  };

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
          onOpenChange={setCreateWorkspaceOpen}
        >
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[625px]">
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
                  onChange={(event) => {
                    setWorkspaceName(event.target.value);
                    setWorkspaceError(null);
                  }}
                />
              </div>
              <div className="space-y-3">
                {emailAccountDrafts.map((emailAccount, index) => (
                  <div
                    key={`email-account-${index}`}
                    className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto]"
                  >
                    <div className="flex flex-col space-y-2">
                      <Label>Email account name</Label>
                      <Input
                        type="text"
                        name={`emailAccountName-${index}`}
                        placeholder="Shared inbox"
                        value={emailAccount.name}
                        onChange={(event) =>
                          updateEmailAccountDraft(index, {
                            name: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Label>Email account address</Label>
                      <Input
                        type="email"
                        name={`emailAccountEmail-${index}`}
                        placeholder="team@example.com"
                        value={emailAccount.email}
                        onChange={(event) =>
                          updateEmailAccountDraft(index, {
                            email: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => {
                          setEmailAccountDrafts((drafts) =>
                            drafts.length === 1
                              ? [{ name: "", email: "" }]
                              : drafts.filter(
                                  (_draft, draftIndex) => draftIndex !== index,
                                ),
                          );
                          setWorkspaceError(null);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove email account</span>
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="secondary"
                  onClick={() =>
                    setEmailAccountDrafts((drafts) => [
                      ...drafts,
                      { name: "", email: "" },
                    ])
                  }
                  disabled={emailAccountDrafts.length >= 10}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add email account
                </Button>
              </div>
              <div className="space-y-3">
                {invitedMemberDrafts.map((invitedMember, index) => (
                  <div
                    key={`invited-member-${index}`}
                    className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_120px_auto]"
                  >
                    <div className="flex flex-col space-y-2">
                      <Label>Invite name</Label>
                      <Input
                        type="text"
                        name={`invitedMemberName-${index}`}
                        placeholder="Alex Morgan"
                        value={invitedMember.name}
                        onChange={(event) =>
                          updateInvitedMemberDraft(index, {
                            name: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Label>Invite email</Label>
                      <Input
                        type="email"
                        name={`invitedMemberEmail-${index}`}
                        placeholder="alex@example.com"
                        value={invitedMember.email}
                        onChange={(event) =>
                          updateInvitedMemberDraft(index, {
                            email: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Label>Role</Label>
                      <select
                        name={`invitedMemberRole-${index}`}
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={invitedMember.role}
                        onChange={(event) =>
                          updateInvitedMemberDraft(index, {
                            role: event.target.value as "ADMIN" | "USER",
                          })
                        }
                      >
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => {
                          setInvitedMemberDrafts((drafts) =>
                            drafts.length === 1
                              ? [{ name: "", email: "", role: "USER" }]
                              : drafts.filter(
                                  (_draft, draftIndex) => draftIndex !== index,
                                ),
                          );
                          setWorkspaceError(null);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove invite</span>
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="secondary"
                  onClick={() =>
                    setInvitedMemberDrafts((drafts) => [
                      ...drafts,
                      { name: "", email: "", role: "USER" },
                    ])
                  }
                  disabled={invitedMemberDrafts.length >= 10}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add invite
                </Button>
              </div>
              {workspaceError ? (
                <DialogDescription className="text-sm text-red-500">
                  {workspaceError}
                </DialogDescription>
              ) : null}
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
                  onClick={async () => {
                    const name = workspaceName.trim();
                    if (!name) {
                      setWorkspaceError("Workspace name is required.");
                      return;
                    }

                    const emailAccounts = emailAccountDrafts
                      .map((emailAccount) => ({
                        name: emailAccount.name.trim(),
                        email: emailAccount.email.trim(),
                      }))
                      .filter(
                        (emailAccount) =>
                          emailAccount.name || emailAccount.email,
                      );
                    const invitedMembers = invitedMemberDrafts
                      .map((invitedMember) => ({
                        name: invitedMember.name.trim(),
                        email: invitedMember.email.trim(),
                        role: invitedMember.role,
                      }))
                      .filter(
                        (invitedMember) =>
                          invitedMember.name || invitedMember.email,
                      );

                    if (
                      emailAccounts.some(
                        (emailAccount) => !emailAccount.email,
                      )
                    ) {
                      setWorkspaceError("Email account address is required.");
                      return;
                    }
                    if (
                      emailAccounts.some(
                        (emailAccount) =>
                          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                            emailAccount.email,
                          ),
                      )
                    ) {
                      setWorkspaceError("Enter valid email account addresses.");
                      return;
                    }
                    if (
                      new Set(
                        emailAccounts.map((emailAccount) =>
                          emailAccount.email.toLowerCase(),
                        ),
                      ).size !== emailAccounts.length
                    ) {
                      setWorkspaceError("Email account addresses must be unique.");
                      return;
                    }
                    if (
                      invitedMembers.some(
                        (invitedMember) => !invitedMember.email,
                      )
                    ) {
                      setWorkspaceError("Invite email address is required.");
                      return;
                    }
                    if (
                      invitedMembers.some(
                        (invitedMember) =>
                          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                            invitedMember.email,
                          ),
                      )
                    ) {
                      setWorkspaceError("Enter valid invite email addresses.");
                      return;
                    }
                    if (
                      new Set(
                        invitedMembers.map((invitedMember) =>
                          invitedMember.email.toLowerCase(),
                        ),
                      ).size !== invitedMembers.length
                    ) {
                      setWorkspaceError("Invite email addresses must be unique.");
                      return;
                    }

                    setWorkspaceError(null);
                    setIsUploading(true);
                    let image: string | undefined;

                    if (file) {
                      const res = await edgestore.publicFiles.upload({
                        file,
                        onProgressChange: (progress) => {
                          // you can use this to show a progress bar
                          console.log(progress);
                        },
                      });
                      image = res.url;
                    }

                    const response = await fetch("/api/workspaces", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name,
                        image,
                        emailAccounts: emailAccounts.length
                          ? emailAccounts.map((emailAccount) => ({
                              name: emailAccount.name || emailAccount.email,
                              email: emailAccount.email,
                            }))
                          : undefined,
                        invitedMembers: invitedMembers.length
                          ? invitedMembers.map((invitedMember) => ({
                              name: invitedMember.name || undefined,
                              email: invitedMember.email,
                              role: invitedMember.role,
                            }))
                          : undefined,
                      }),
                    });

                    if (!response.ok) {
                      setWorkspaceError("Could not create workspace.");
                      setIsUploading(false);
                      return;
                    }

                    await mutate("/api/workspaces");
                    setWorkspaceName("");
                    setEmailAccountDrafts([{ name: "", email: "" }]);
                    setInvitedMemberDrafts([
                      { name: "", email: "", role: "USER" },
                    ]);
                    setFile(undefined);
                    setIsUploading(false);
                    setCreateWorkspaceOpen(false);
                  }}
                  disabled={isUploading}
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
            <AccountSwitcher
              isCollapsed={isCollapsed}
              accounts={visibleAccounts}
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
