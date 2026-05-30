import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { openCreateWorkspaceOpenAtom } from "@/utils/store";
import type { WorkspaceSummary } from "@/utils/workspace-types";
import { useSetAtom } from "jotai";
import { Plus } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";

const userNavigation = [
  { name: "Usage", href: "/usage" },
  {
    name: "Sign out",
    href: "#",
    onClick: () => signOut({ callbackUrl: window.location.origin }),
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function WorkspaceSidebar({
  workspaces,
  selectedWorkspaceId,
  onSelectWorkspace,
}: {
  workspaces: WorkspaceSummary[];
  selectedWorkspaceId: string | null;
  onSelectWorkspace: (workspaceId: string) => void;
}) {
  const { data: session } = useSession();
  const setCreateWorkspaceOpen = useSetAtom(openCreateWorkspaceOpenAtom);

  return (
    <div className="left-0 top-0 h-screen w-16 flex-col items-center justify-between space-y-2 border-r">
      <div className="flex h-full flex-col justify-between">
        <div className="flex flex-col items-center space-y-4 p-2">
          {workspaces.map((workspace) => (
            <Button
              key={workspace.id}
              title={workspace.name}
              variant={
                workspace.id === selectedWorkspaceId ? "default" : "secondary"
              }
              onClick={() => onSelectWorkspace(workspace.id)}
              className="relative flex h-12 w-full items-center justify-center overflow-hidden rounded-xl font-cal text-xl font-semibold"
            >
              {workspace.image ? (
                <Image
                  src={workspace.image}
                  fill={true}
                  alt={workspace.name}
                  className="rounded-xl object-cover"
                />
              ) : (
                getInitials(workspace.name)
              )}
            </Button>
          ))}
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

        {session?.user && (
          <div className="flex w-full flex-col items-center pb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarImage src={session.user.image || undefined} />
                  <AvatarFallback>
                    {session.user.name ? session.user.name[0] : ""}
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
