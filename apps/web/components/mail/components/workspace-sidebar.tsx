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
  workspacesAtom,
} from "@/utils/store";
import { type WorkspaceRecord } from "@/utils/workspace";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
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

function formatWorkspaceInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "WS";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function WorkspaceAvatarButton(props: {
  workspace: WorkspaceRecord;
  isActive: boolean;
  onSelect: (workspaceId: string) => void;
}) {
  const { workspace, isActive, onSelect } = props;
  const activeBorder = isActive ? "ring-2 ring-primary" : "opacity-80";

  return (
    <Button
      type="button"
      title={workspace.name}
      onClick={() => onSelect(workspace.id)}
      className={`relative flex h-12 w-full items-center justify-center rounded-xl bg-foreground/80 font-cal text-xl font-semibold text-white ${activeBorder}`}
    >
      {workspace.image ? (
        <Image
          src={workspace.image}
          fill={true}
          alt={workspace.name}
          className="rounded-xl"
        />
      ) : (
        formatWorkspaceInitials(workspace.name)
      )}
    </Button>
  );
}

// Renders the Slack-style left rail for switching between personal and team
// workspaces or launching the workspace creation and invitation modal.
export function WorkspaceSidebar() {
  const { data: session } = useSession();
  const setCreateWorkspaceOpen = useSetAtom(openCreateWorkspaceOpenAtom);
  const workspaces = useAtomValue(workspacesAtom);
  const [activeWorkspaceId, setActiveWorkspaceId] = useAtom(
    activeWorkspaceIdAtom,
  );

  return (
    <div className="left-0 top-0 h-screen w-16 flex-col items-center justify-between space-y-2 border-r">
      <div className="flex h-full flex-col justify-between">
        <div className="flex flex-col items-center space-y-4 p-2">
          {workspaces.map((ws) => (
            <WorkspaceAvatarButton
              key={ws.id}
              workspace={ws}
              isActive={ws.id === activeWorkspaceId}
              onSelect={setActiveWorkspaceId}
            />
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
