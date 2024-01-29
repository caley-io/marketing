import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export function WorkspaceSidebar() {
  const { data: session, status } = useSession();
  return (
    <div className="left-0 top-0 h-screen w-16 flex-col items-center justify-between space-y-2 border-r">
      <div className="flex h-full flex-col justify-between">
        <div className="flex flex-col items-center space-y-4 p-2">
          <Button className="relative flex h-12 w-full items-center justify-center rounded-xl bg-foreground/60 font-cal text-xl font-semibold text-white">
            <Image
              src="https://github.com/jeremyscatigna.png"
              fill={true}
              alt="Workspace"
              className="rounded-xl"
            />
          </Button>
          <Button className="flex h-12 w-full items-center justify-center rounded-xl bg-foreground/80 font-cal text-xl font-semibold text-white">
            JS
          </Button>
          <Button className="flex h-12 w-full items-center justify-center rounded-xl bg-foreground font-cal text-xl font-semibold">
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
