import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  activeWorkspaceIdAtom,
  openCreateWorkspaceOpenAtom,
  openWorkspaceManageAtom,
} from "@/utils/store";
import { useAtom, useSetAtom } from "jotai";
import { Plus, Users2 } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import * as React from "react";
import useSWR from "swr";

const userNavigation = [
  { name: "Usage", href: "/usage" },
  {
    name: "Sign out",
    href: "#",
    onClick: () => signOut({ callbackUrl: window.location.origin }),
  },
];

export interface WorkspaceSummary {
  id: string;
  name: string;
  image?: string | null;
  membership?: {
    id: number;
    role: "OWNER" | "ADMIN" | "USER";
    userId?: string | null;
    invitedEmail?: string | null;
    invitedName?: string | null;
    user?: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    } | null;
  }[];
  emailAccounts?: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  }[];
}

function getWorkspaceInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "WS";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function WorkspaceSidebar() {
  const { data: session } = useSession();
  const setCreateWorkspaceOpen = useSetAtom(openCreateWorkspaceOpenAtom);
  const setWorkspaceManageOpen = useSetAtom(openWorkspaceManageAtom);
  const [activeWorkspaceId, setActiveWorkspaceId] = useAtom(
    activeWorkspaceIdAtom,
  );

  const { data } = useSWR<{ workspaces: WorkspaceSummary[] }>(
    "/api/workspaces",
  );
  const workspaces = data?.workspaces ?? [];

  React.useEffect(() => {
    if (workspaces.length > 0 && !activeWorkspaceId) {
      setActiveWorkspaceId(workspaces[0].id);
    }
  }, [workspaces, activeWorkspaceId, setActiveWorkspaceId]);

  return (
    <div className="left-0 top-0 h-screen w-16 flex-col items-center justify-between space-y-2 border-r">
      <div className="flex h-full flex-col justify-between">
        <div className="flex flex-col items-center space-y-4 p-2">
          {workspaces.map((workspace) => {
            const isActive = workspace.id === activeWorkspaceId;
            return (
              <Button
                key={workspace.id}
                title={workspace.name}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveWorkspaceId(workspace.id);
                }}
                className={`relative flex h-12 w-full items-center justify-center rounded-xl font-cal text-xl font-semibold text-white ${
                  isActive
                    ? "bg-foreground ring-2 ring-primary ring-offset-2"
                    : "bg-foreground/60 hover:bg-foreground/80"
                }`}
              >
                {workspace.image ? (
                  <Image
                    src={workspace.image}
                    fill={true}
                    alt={workspace.name}
                    className="rounded-xl object-cover"
                  />
                ) : (
                  getWorkspaceInitials(workspace.name)
                )}
              </Button>
            );
          })}

          {activeWorkspaceId && (
            <Button
              title="Manage Workspace Team & Email Accounts"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                setWorkspaceManageOpen(true);
              }}
              className="flex h-12 w-full items-center justify-center rounded-xl"
            >
              <Users2 className="h-5 w-5" />
            </Button>
          )}

          <Button
            title="Create Workspace"
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
  );
}
