import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WorkspacesResponse } from "@/app/api/workspaces/route";
import {
  openCreateWorkspaceOpenAtom,
  selectedWorkspaceIdAtom,
} from "@/utils/store";
import { cn } from "@/utils";
import { useAtom, useSetAtom } from "jotai";
import { Loader2, Plus } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import useSWR from "swr";

const SELECTED_WORKSPACE_STORAGE_KEY = "caley:selected-workspace";

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
  const searchParams = useSearchParams();
  const workspaceIdFromUrl = searchParams.get("workspaceId");
  const setCreateWorkspaceOpen = useSetAtom(openCreateWorkspaceOpenAtom);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useAtom(
    selectedWorkspaceIdAtom,
  );
  const { data, isLoading } = useSWR<WorkspacesResponse>("/api/workspaces");
  const workspaces = React.useMemo(
    () => data?.workspaces ?? [],
    [data?.workspaces],
  );

  React.useEffect(() => {
    if (workspaceIdFromUrl) {
      setSelectedWorkspaceId(workspaceIdFromUrl);
      window.localStorage.setItem(
        SELECTED_WORKSPACE_STORAGE_KEY,
        workspaceIdFromUrl,
      );
      return;
    }

    const storedWorkspaceId = window.localStorage.getItem(
      SELECTED_WORKSPACE_STORAGE_KEY,
    );

    if (storedWorkspaceId) setSelectedWorkspaceId(storedWorkspaceId);
  }, [setSelectedWorkspaceId, workspaceIdFromUrl]);

  React.useEffect(() => {
    if (!workspaces.length) return;

    const selectedWorkspaceExists = workspaces.some(
      (workspace) => workspace.id === selectedWorkspaceId,
    );

    if (!selectedWorkspaceId || !selectedWorkspaceExists) {
      const nextWorkspaceId = workspaces[0].id;
      setSelectedWorkspaceId(nextWorkspaceId);
      window.localStorage.setItem(
        SELECTED_WORKSPACE_STORAGE_KEY,
        nextWorkspaceId,
      );
    }
  }, [selectedWorkspaceId, setSelectedWorkspaceId, workspaces]);

  const selectWorkspace = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    window.localStorage.setItem(SELECTED_WORKSPACE_STORAGE_KEY, workspaceId);
  };

  return (
    <div className="left-0 top-0 h-screen w-16 flex-col items-center justify-between space-y-2 border-r">
      <div className="flex h-full flex-col justify-between">
        <div className="flex flex-col items-center space-y-4 p-2">
          {isLoading && (
            <div className="flex h-12 w-full items-center justify-center rounded-xl bg-muted">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {workspaces.map((workspace) => {
            const initials = workspace.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            const isSelected = workspace.id === selectedWorkspaceId;

            return (
              <Button
                key={workspace.id}
                type="button"
                aria-label={`Switch to ${workspace.name}`}
                title={workspace.name}
                onClick={() => selectWorkspace(workspace.id)}
                className={cn(
                  "relative flex h-12 w-full items-center justify-center overflow-hidden rounded-xl border border-transparent bg-foreground/80 font-cal text-sm font-semibold text-white",
                  isSelected && "border-primary ring-2 ring-primary/30",
                )}
              >
                {workspace.image ? (
                  <Image
                    src={workspace.image}
                    fill={true}
                    alt=""
                    className="object-cover"
                  />
                ) : (
                  initials
                )}
              </Button>
            );
          })}
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
  );
}
