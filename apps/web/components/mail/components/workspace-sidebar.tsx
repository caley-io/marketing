import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils";
import {
  activeEmailAccountAtom,
  activeWorkspaceIdAtom,
  openCreateWorkspaceOpenAtom,
  openWorkspaceSettingsAtom,
  workspacesAtom,
} from "@/utils/store";
import { getWorkspaceInitials } from "@/utils/workspaces";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Plus, Settings, Users } from "lucide-react";
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

export function WorkspaceSidebar() {
  const { data: session } = useSession();
  const workspaces = useAtomValue(workspacesAtom);
  const [activeWorkspaceId, setActiveWorkspaceId] = useAtom(
    activeWorkspaceIdAtom,
  );
  const setActiveEmailAccount = useSetAtom(activeEmailAccountAtom);
  const setCreateWorkspaceOpen = useSetAtom(openCreateWorkspaceOpenAtom);
  const setWorkspaceSettingsOpen = useSetAtom(openWorkspaceSettingsAtom);

  return (
    <div className="left-0 top-0 h-screen w-16 flex-col items-center justify-between space-y-2 border-r">
      <div className="flex h-full flex-col justify-between">
        <div className="flex flex-col items-center space-y-3 p-2">
          {workspaces.map((workspace) => {
            const isSelected = workspace.id === activeWorkspaceId;
            return (
              <Tooltip key={workspace.id} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveWorkspaceId(workspace.id);
                      const firstEmail = workspace.emailAccounts?.[0]?.email;
                      if (firstEmail) {
                        setActiveEmailAccount(firstEmail);
                      }
                    }}
                    className={cn(
                      "relative flex h-12 w-full items-center justify-center rounded-xl bg-foreground/80 font-cal text-base font-semibold text-white transition-all",
                      isSelected && "ring-2 ring-primary ring-offset-2",
                    )}
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
                </TooltipTrigger>
                <TooltipContent side="right">
                  <div className="text-xs font-medium">{workspace.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {workspace.membership?.length || 1} member
                    {(workspace.membership?.length || 1) === 1 ? "" : "s"}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  setCreateWorkspaceOpen(true);
                }}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-foreground font-cal text-xl font-semibold"
                aria-label="Create workspace"
              >
                <Plus className="h-6 w-6 text-background" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Create workspace</TooltipContent>
          </Tooltip>

          {activeWorkspaceId && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    setWorkspaceSettingsOpen(true);
                  }}
                  className="flex h-10 w-full items-center justify-center rounded-xl"
                  aria-label="Manage workspace team and accounts"
                >
                  <Users className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Team & Email Accounts
              </TooltipContent>
            </Tooltip>
          )}
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
              <DropdownMenuContent align="end" className="w-[180px]">
                <DropdownMenuItem>{session.user.email}</DropdownMenuItem>
                {activeWorkspaceId && (
                  <DropdownMenuItem
                    onClick={() => setWorkspaceSettingsOpen(true)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Workspace settings
                  </DropdownMenuItem>
                )}
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
