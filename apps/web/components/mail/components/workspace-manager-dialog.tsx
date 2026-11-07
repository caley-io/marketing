"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  activeWorkspaceIdAtom,
  openCreateWorkspaceOpenAtom,
  workspacesAtom,
} from "@/utils/store";
import { useAtom } from "jotai";
import { Loader2, MailPlus, Plus, UserPlus } from "lucide-react";

type InviteRoleOption = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

interface StagedInvite {
  email: string;
  role: InviteRoleOption;
}

interface StagedGoogleAccount {
  name: string;
  email: string;
  provider: "gmail" | "google_workspace";
}

function TeamInviteSection(props: {
  invites: StagedInvite[];
  onAddInvite: (invite: StagedInvite) => void;
}) {
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<InviteRoleOption>("MEMBER");

  const handleAdd = () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    props.onAddInvite({ email: trimmed, role });
    setEmail("");
  };

  return (
    <div className="space-y-2 border-t pt-3">
      <Label>Invite Team Members (Optional)</Label>
      <div className="flex space-x-2">
        <Input
          type="email"
          placeholder="teammate@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <select
          aria-label="Member role"
          value={role}
          onChange={(e) => setRole(e.target.value as InviteRoleOption)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
          <option value="VIEWER">Viewer</option>
          <option value="OWNER">Owner</option>
        </select>
        <Button type="button" variant="secondary" onClick={handleAdd}>
          <UserPlus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </div>
      {props.invites.length > 0 && (
        <ul className="space-y-1 text-xs text-muted-foreground">
          {props.invites.map((item) => (
            <li key={`${item.email}-${item.role}`}>
              {item.email} ({item.role})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GoogleAccountsSection(props: {
  accounts: StagedGoogleAccount[];
  onAddAccount: (account: StagedGoogleAccount) => void;
}) {
  const [label, setLabel] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [provider, setProvider] = React.useState<"gmail" | "google_workspace">(
    "gmail",
  );

  const handleLink = () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) return;
    props.onAddAccount({
      name: label.trim() || cleanEmail,
      email: cleanEmail,
      provider,
    });
    setLabel("");
    setEmail("");
  };

  return (
    <div className="space-y-2 border-t pt-3">
      <Label>Link Gmail / Google Workspace Accounts</Label>
      <div className="flex space-x-2">
        <Input
          type="text"
          placeholder="Account label (e.g. Support)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <Input
          type="email"
          placeholder="inbox@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <select
          aria-label="Google account provider"
          value={provider}
          onChange={(e) =>
            setProvider(e.target.value as "gmail" | "google_workspace")
          }
          className="rounded-md border bg-background px-2 py-2 text-sm"
        >
          <option value="gmail">Gmail</option>
          <option value="google_workspace">Google Workspace</option>
        </select>
        <Button type="button" variant="secondary" onClick={handleLink}>
          <MailPlus className="mr-1 h-4 w-4" />
          Link
        </Button>
      </div>
      {props.accounts.length > 0 && (
        <ul className="space-y-1 text-xs text-muted-foreground">
          {props.accounts.map((acc) => (
            <li key={acc.email}>
              {acc.name} — {acc.email} ({acc.provider})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Modal dialog enabling users to provision a new personal or team workspace,
// assign RBAC roles to invited teammates, and connect multiple Google accounts.
export function WorkspaceManagerDialog() {
  const [open, setOpen] = useAtom(openCreateWorkspaceOpenAtom);
  const [workspaces, setWorkspaces] = useAtom(workspacesAtom);
  const [, setActiveWorkspaceId] = useAtom(activeWorkspaceIdAtom);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [invites, setInvites] = React.useState<StagedInvite[]>([]);
  const [accounts, setAccounts] = React.useState<StagedGoogleAccount[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleCreateWorkspace = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/user/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          invites,
          emailAccounts: accounts,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setWorkspaces([...workspaces, data.workspace]);
        setActiveWorkspaceId(data.workspace.id);
        setName("");
        setDescription("");
        setInvites([]);
        setAccounts([]);
        setOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => setOpen(!open)}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="pb-2 font-cal text-xl font-bold">
            Create Workspace
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label>Workspace Name</Label>
            <Input
              type="text"
              name="name"
              placeholder="Personal or Acme Team"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <Label>Description</Label>
            <Input
              type="text"
              name="description"
              placeholder="Shared inboxes and team workflows"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <TeamInviteSection
            invites={invites}
            onAddInvite={(inv) => setInvites([...invites, inv])}
          />
          <GoogleAccountsSection
            accounts={accounts}
            onAddAccount={(acc) => setAccounts([...accounts, acc])}
          />
        </div>
        <DialogFooter>
          <div className="flex space-x-2">
            <Button onClick={() => setOpen(false)} variant="secondary">
              Cancel
            </Button>
            <Button onClick={handleCreateWorkspace} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Workspace
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
