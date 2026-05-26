import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { openCreateWorkspaceOpenAtom } from "@/utils/store";
import { useSetAtom } from "jotai";
import {
  Building2,
  Loader2,
  Mail,
  Plus,
  Save,
  Trash2,
  UserPlus,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import * as React from "react";
import useSWR from "swr";

type EmailAccount = {
  id: string;
  name: string;
  email: string;
};

type WorkspaceMember = {
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
};

type Workspace = {
  id: string;
  name: string;
  image: string | null;
  role: "OWNER" | "ADMIN" | "USER";
  members: WorkspaceMember[];
  emailAccounts: EmailAccount[];
};

type WorkspacesResponse = {
  workspaces: Workspace[];
};

type EmailAccountDraft = {
  name: string;
  email: string;
};

type WorkspaceDraft = {
  name: string;
  image: string;
};

type MemberDraft = {
  name: string;
  email: string;
  role: "ADMIN" | "USER";
};

const userNavigation = [
  { name: "Usage", href: "/usage" },
  {
    name: "Sign out",
    href: "#",
    onClick: () => signOut({ callbackUrl: window.location.origin }),
  },
];

export function WorkspaceSidebar() {
  const { data: session, status } = useSession();
  const setCreateWorkspaceOpen = useSetAtom(openCreateWorkspaceOpenAtom);
  const { data, isLoading, mutate } = useSWR<WorkspacesResponse>(
    status === "authenticated" ? "/api/workspaces" : null,
  );
  const workspaces = data?.workspaces ?? [];
  const [managingWorkspaceId, setManagingWorkspaceId] = React.useState<
    string | null
  >(null);
  const [emailAccountDraft, setEmailAccountDraft] =
    React.useState<EmailAccountDraft>({ name: "", email: "" });
  const [editingEmailAccounts, setEditingEmailAccounts] = React.useState<
    Record<string, EmailAccountDraft>
  >({});
  const [emailAccountError, setEmailAccountError] = React.useState<
    string | null
  >(null);
  const [isSavingEmailAccount, setIsSavingEmailAccount] =
    React.useState(false);
  const [workspaceDraft, setWorkspaceDraft] =
    React.useState<WorkspaceDraft>({ name: "", image: "" });
  const [workspaceError, setWorkspaceError] = React.useState<string | null>(
    null,
  );
  const [isSavingWorkspace, setIsSavingWorkspace] = React.useState(false);
  const [memberDraft, setMemberDraft] = React.useState<MemberDraft>({
    name: "",
    email: "",
    role: "USER",
  });
  const [editingMembers, setEditingMembers] = React.useState<
    Record<string, { role: "ADMIN" | "USER" }>
  >({});
  const [memberError, setMemberError] = React.useState<string | null>(null);
  const [isSavingMember, setIsSavingMember] = React.useState(false);
  const managingWorkspace =
    workspaces.find((workspace) => workspace.id === managingWorkspaceId) ??
    null;

  React.useEffect(() => {
    if (!managingWorkspace) {
      return;
    }

    setEditingEmailAccounts(
      Object.fromEntries(
        managingWorkspace.emailAccounts.map((emailAccount) => [
          emailAccount.id,
          {
            name: emailAccount.name,
            email: emailAccount.email,
          },
        ]),
      ),
    );
    setWorkspaceDraft({
      name: managingWorkspace.name,
      image: managingWorkspace.image ?? "",
    });
    setEditingMembers(
      Object.fromEntries(
        managingWorkspace.members.map((member) => [
          member.id,
          {
            role: member.role === "OWNER" ? "USER" : member.role,
          },
        ]),
      ),
    );
    setEmailAccountDraft({ name: "", email: "" });
    setMemberDraft({ name: "", email: "", role: "USER" });
    setWorkspaceError(null);
    setEmailAccountError(null);
    setMemberError(null);
  }, [managingWorkspace]);

  const updateWorkspace = async () => {
    if (!managingWorkspace) {
      return;
    }

    const name = workspaceDraft.name.trim();
    const image = workspaceDraft.image.trim();
    if (!name) {
      setWorkspaceError("Workspace name is required.");
      return;
    }
    if (image) {
      try {
        new URL(image);
      } catch {
        setWorkspaceError("Enter a valid workspace image URL.");
        return;
      }
    }

    setIsSavingWorkspace(true);
    setWorkspaceError(null);
    const response = await fetch(`/api/workspaces/${managingWorkspace.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, image: image || null }),
    });
    setIsSavingWorkspace(false);

    if (!response.ok) {
      setWorkspaceError("Could not update workspace details.");
      return;
    }

    await mutate();
  };

  const addEmailAccount = async () => {
    if (!managingWorkspace) {
      return;
    }

    const name = emailAccountDraft.name.trim();
    const email = emailAccountDraft.email.trim();
    if (!name || !email) {
      setEmailAccountError("Name and email address are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailAccountError("Enter a valid email account address.");
      return;
    }
    if (
      managingWorkspace.emailAccounts.some(
        (emailAccount) =>
          emailAccount.email.toLowerCase() === email.toLowerCase(),
      )
    ) {
      setEmailAccountError("Email account already exists in this workspace.");
      return;
    }

    setIsSavingEmailAccount(true);
    setEmailAccountError(null);
    const response = await fetch(
      `/api/workspaces/${managingWorkspace.id}/email-accounts`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      },
    );
    setIsSavingEmailAccount(false);

    if (!response.ok) {
      setEmailAccountError("Could not add email account.");
      return;
    }

    setEmailAccountDraft({ name: "", email: "" });
    await mutate();
  };

  const addMember = async () => {
    if (!managingWorkspace) {
      return;
    }

    const name = memberDraft.name.trim();
    const email = memberDraft.email.trim();
    if (!email) {
      setMemberError("Invite email address is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMemberError("Enter a valid invite email address.");
      return;
    }
    if (
      managingWorkspace.members.some(
        (member) =>
          getMemberEmail(member)?.toLowerCase() === email.toLowerCase(),
      )
    ) {
      setMemberError("Member already belongs to this workspace.");
      return;
    }

    setIsSavingMember(true);
    setMemberError(null);
    const response = await fetch(
      `/api/workspaces/${managingWorkspace.id}/members`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || undefined,
          email,
          role: memberDraft.role,
        }),
      },
    );
    setIsSavingMember(false);

    if (!response.ok) {
      setMemberError("Could not invite member.");
      return;
    }

    setMemberDraft({ name: "", email: "", role: "USER" });
    await mutate();
  };

  const updateMemberRole = async (member: WorkspaceMember) => {
    if (!managingWorkspace || member.role === "OWNER") {
      return;
    }

    const draft = editingMembers[member.id] ?? {
      role: member.role === "OWNER" ? "USER" : member.role,
    };
    setIsSavingMember(true);
    setMemberError(null);
    const response = await fetch(
      `/api/workspaces/${managingWorkspace.id}/members/${member.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: draft.role }),
      },
    );
    setIsSavingMember(false);

    if (!response.ok) {
      setMemberError("Could not update member role.");
      return;
    }

    await mutate();
  };

  const deleteMember = async (member: WorkspaceMember) => {
    if (!managingWorkspace || member.role === "OWNER") {
      return;
    }

    setIsSavingMember(true);
    setMemberError(null);
    const response = await fetch(
      `/api/workspaces/${managingWorkspace.id}/members/${member.id}`,
      { method: "DELETE" },
    );
    setIsSavingMember(false);

    if (!response.ok) {
      setMemberError("Could not remove member.");
      return;
    }

    await mutate();
  };

  const updateEmailAccount = async (emailAccount: EmailAccount) => {
    if (!managingWorkspace) {
      return;
    }

    const draft = editingEmailAccounts[emailAccount.id] ?? emailAccount;
    const name = draft.name.trim();
    const email = draft.email.trim();
    if (!name || !email) {
      setEmailAccountError("Name and email address are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailAccountError("Enter a valid email account address.");
      return;
    }
    if (
      managingWorkspace.emailAccounts.some(
        (account) =>
          account.id !== emailAccount.id &&
          account.email.toLowerCase() === email.toLowerCase(),
      )
    ) {
      setEmailAccountError("Email account already exists in this workspace.");
      return;
    }

    setIsSavingEmailAccount(true);
    setEmailAccountError(null);
    const response = await fetch(
      `/api/workspaces/${managingWorkspace.id}/email-accounts/${emailAccount.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      },
    );
    setIsSavingEmailAccount(false);

    if (!response.ok) {
      setEmailAccountError("Could not update email account.");
      return;
    }

    await mutate();
  };

  const deleteEmailAccount = async (emailAccount: EmailAccount) => {
    if (!managingWorkspace) {
      return;
    }

    setIsSavingEmailAccount(true);
    setEmailAccountError(null);
    const response = await fetch(
      `/api/workspaces/${managingWorkspace.id}/email-accounts/${emailAccount.id}`,
      { method: "DELETE" },
    );
    setIsSavingEmailAccount(false);

    if (!response.ok) {
      setEmailAccountError("Could not remove email account.");
      return;
    }

    await mutate();
  };

  return (
    <>
      <div className="left-0 top-0 h-screen w-16 flex-col items-center justify-between space-y-2 border-r">
        <div className="flex h-full flex-col justify-between">
          <div className="flex flex-col items-center space-y-4 p-2">
            {isLoading ? (
              <Button className="flex h-12 w-full items-center justify-center rounded-xl bg-foreground/60">
                <Loader2 className="h-5 w-5 animate-spin text-background" />
              </Button>
            ) : workspaces.length > 0 ? (
              workspaces.map((workspace) => {
                const canManageWorkspace =
                  workspace.role === "OWNER" || workspace.role === "ADMIN";

                return (
                  <DropdownMenu key={workspace.id}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        title={workspace.name}
                        className="flex h-12 w-full items-center justify-center rounded-xl bg-foreground/80 p-0"
                      >
                        <Avatar className="h-full w-full rounded-xl">
                          <AvatarImage src={workspace.image || undefined} />
                          <AvatarFallback className="rounded-xl bg-foreground/80 font-cal text-xl font-semibold text-background">
                            {getWorkspaceInitials(workspace.name)}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      side="right"
                      className="w-56"
                    >
                      <DropdownMenuLabel>{workspace.name}</DropdownMenuLabel>
                      <DropdownMenuItem
                        disabled={!canManageWorkspace}
                        onSelect={(event) => {
                          event.preventDefault();
                          if (canManageWorkspace) {
                            setManagingWorkspaceId(workspace.id);
                          }
                        }}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Manage workspace
                      </DropdownMenuItem>
                      {workspace.emailAccounts.length ? (
                        <>
                          <DropdownMenuSeparator />
                          {workspace.emailAccounts.slice(0, 3).map((account) => (
                            <DropdownMenuItem
                              key={account.id}
                              disabled
                              className="block truncate"
                            >
                              {account.email}
                            </DropdownMenuItem>
                          ))}
                        </>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })
            ) : (
              <Button className="flex h-12 w-full items-center justify-center rounded-xl bg-foreground/60">
                <Building2 className="h-5 w-5 text-background" />
              </Button>
            )}
            <Button
              onClick={(e) => {
                e.preventDefault();
                setCreateWorkspaceOpen(true);
              }}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-foreground font-cal text-xl font-semibold"
            >
              <Plus className="h-8 w-8 text-background" />
            </Button>
          </div>

          {session && session.user && (
            <div className="flex w-full flex-col items-center pb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="cursor-pointer">
                    <AvatarImage src={session?.user.image || undefined} />
                    <AvatarFallback>
                      {session?.user.name ? session.user.name[0] : ""}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                  <DropdownMenuItem>{session.user.email}</DropdownMenuItem>
                  {userNavigation.map((item) => (
                    <DropdownMenuItem key={item.name}>
                      <a href={item.href} onClick={item.onClick}>
                        {item.name}
                      </a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
      <Dialog
        open={!!managingWorkspace}
        onOpenChange={(open) => {
          if (!open) {
            setManagingWorkspaceId(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{managingWorkspace?.name} workspace</DialogTitle>
            <DialogDescription>
              Manage team members and connected Gmail or Google Workspace
              accounts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <DialogDescription>Workspace details</DialogDescription>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <div className="flex flex-col space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={workspaceDraft.name}
                    onChange={(event) => {
                      setWorkspaceDraft((draft) => ({
                        ...draft,
                        name: event.target.value,
                      }));
                      setWorkspaceError(null);
                    }}
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <Label>Logo URL</Label>
                  <Input
                    placeholder="https://example.com/logo.png"
                    value={workspaceDraft.image}
                    onChange={(event) => {
                      setWorkspaceDraft((draft) => ({
                        ...draft,
                        image: event.target.value,
                      }));
                      setWorkspaceError(null);
                    }}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    size="icon"
                    variant="secondary"
                    disabled={isSavingWorkspace}
                    onClick={updateWorkspace}
                  >
                    <Save className="h-4 w-4" />
                    <span className="sr-only">Save workspace details</span>
                  </Button>
                </div>
              </div>
              {workspaceError ? (
                <DialogDescription className="text-red-500">
                  {workspaceError}
                </DialogDescription>
              ) : null}
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <UserPlus className="h-4 w-4" />
                <DialogDescription>Team members</DialogDescription>
              </div>
              {managingWorkspace?.members.length ? (
                <div className="space-y-3">
                  {managingWorkspace.members.map((member) => {
                    const draft = editingMembers[member.id] ?? {
                      role: member.role === "OWNER" ? "USER" : member.role,
                    };
                    const canEditMember =
                      managingWorkspace.role === "OWNER" &&
                      member.role !== "OWNER";

                    return (
                      <div
                        key={member.id}
                        className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_120px_auto_auto]"
                      >
                        <div className="flex flex-col space-y-2">
                          <Label>Name</Label>
                          <Input value={getMemberName(member)} disabled />
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Label>Email</Label>
                          <Input value={getMemberEmail(member) ?? ""} disabled />
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Label>Role</Label>
                          <select
                            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                            value={member.role === "OWNER" ? "OWNER" : draft.role}
                            disabled={!canEditMember || isSavingMember}
                            onChange={(event) => {
                              setEditingMembers((drafts) => ({
                                ...drafts,
                                [member.id]: {
                                  role: event.target.value as "ADMIN" | "USER",
                                },
                              }));
                              setMemberError(null);
                            }}
                          >
                            {member.role === "OWNER" ? (
                              <option value="OWNER">Owner</option>
                            ) : null}
                            <option value="USER">User</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </div>
                        <div className="flex items-end">
                          <Button
                            size="icon"
                            variant="secondary"
                            disabled={!canEditMember || isSavingMember}
                            onClick={() => updateMemberRole(member)}
                          >
                            <Save className="h-4 w-4" />
                            <span className="sr-only">Save member role</span>
                          </Button>
                        </div>
                        <div className="flex items-end">
                          <Button
                            size="icon"
                            variant="secondary"
                            disabled={!canEditMember || isSavingMember}
                            onClick={() => deleteMember(member)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove member</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
              <div className="grid grid-cols-1 gap-3 border-t pt-4 sm:grid-cols-[1fr_1fr_120px_auto]">
                <div className="flex flex-col space-y-2">
                  <Label>Invite name</Label>
                  <Input
                    placeholder="Alex Morgan"
                    value={memberDraft.name}
                    onChange={(event) => {
                      setMemberDraft((draft) => ({
                        ...draft,
                        name: event.target.value,
                      }));
                      setMemberError(null);
                    }}
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <Label>Invite email</Label>
                  <Input
                    type="email"
                    placeholder="alex@example.com"
                    value={memberDraft.email}
                    onChange={(event) => {
                      setMemberDraft((draft) => ({
                        ...draft,
                        email: event.target.value,
                      }));
                      setMemberError(null);
                    }}
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <Label>Role</Label>
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    value={memberDraft.role}
                    onChange={(event) => {
                      setMemberDraft((draft) => ({
                        ...draft,
                        role: event.target.value as "ADMIN" | "USER",
                      }));
                      setMemberError(null);
                    }}
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="secondary"
                    disabled={isSavingMember}
                    onClick={addMember}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Invite
                  </Button>
                </div>
              </div>
              {memberError ? (
                <DialogDescription className="text-red-500">
                  {memberError}
                </DialogDescription>
              ) : null}
            </div>
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <DialogDescription>Email accounts</DialogDescription>
              </div>
              {managingWorkspace?.emailAccounts.length ? (
                <div className="space-y-3">
                  {managingWorkspace.emailAccounts.map((emailAccount) => {
                    const draft = editingEmailAccounts[emailAccount.id] ?? {
                      name: emailAccount.name,
                      email: emailAccount.email,
                    };

                    return (
                      <div
                        key={emailAccount.id}
                        className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto_auto]"
                      >
                        <div className="flex flex-col space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={draft.name}
                            onChange={(event) => {
                              setEditingEmailAccounts((drafts) => ({
                                ...drafts,
                                [emailAccount.id]: {
                                  ...draft,
                                  name: event.target.value,
                                },
                              }));
                              setEmailAccountError(null);
                            }}
                          />
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={draft.email}
                            onChange={(event) => {
                              setEditingEmailAccounts((drafts) => ({
                                ...drafts,
                                [emailAccount.id]: {
                                  ...draft,
                                  email: event.target.value,
                                },
                              }));
                              setEmailAccountError(null);
                            }}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            size="icon"
                            variant="secondary"
                            disabled={isSavingEmailAccount}
                            onClick={() => updateEmailAccount(emailAccount)}
                          >
                            <Save className="h-4 w-4" />
                            <span className="sr-only">Save email account</span>
                          </Button>
                        </div>
                        <div className="flex items-end">
                          <Button
                            size="icon"
                            variant="secondary"
                            disabled={isSavingEmailAccount}
                            onClick={() => deleteEmailAccount(emailAccount)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">
                              Remove email account
                            </span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <DialogDescription>
                  This workspace does not have email accounts yet.
                </DialogDescription>
              )}
              <div className="grid grid-cols-1 gap-3 border-t pt-4 sm:grid-cols-[1fr_1fr_auto]">
                <div className="flex flex-col space-y-2">
                  <Label>New account name</Label>
                  <Input
                    placeholder="Support inbox"
                    value={emailAccountDraft.name}
                    onChange={(event) => {
                      setEmailAccountDraft((draft) => ({
                        ...draft,
                        name: event.target.value,
                      }));
                      setEmailAccountError(null);
                    }}
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <Label>New account email</Label>
                  <Input
                    type="email"
                    placeholder="support@example.com"
                    value={emailAccountDraft.email}
                    onChange={(event) => {
                      setEmailAccountDraft((draft) => ({
                        ...draft,
                        email: event.target.value,
                      }));
                      setEmailAccountError(null);
                    }}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="secondary"
                    disabled={
                      isSavingEmailAccount ||
                      (managingWorkspace?.emailAccounts.length ?? 0) >= 10
                    }
                    onClick={addEmailAccount}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>
              {emailAccountError ? (
                <DialogDescription className="text-red-500">
                  {emailAccountError}
                </DialogDescription>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function getMemberName(member: WorkspaceMember) {
  return member.user?.name || member.invitedName || "Pending invite";
}

function getMemberEmail(member: WorkspaceMember) {
  return member.user?.email || member.invitedEmail;
}

function getWorkspaceInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "WS";
}
