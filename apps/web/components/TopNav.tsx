import { Bars3Icon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const userNavigation = [
  { name: "Usage", href: "/usage" },
  {
    name: "Sign out",
    href: "#",
    onClick: () => signOut({ callbackUrl: window.location.origin }),
  },
];

export function TopNav(props: { setSidebarOpen: (open: boolean) => void }) {
  return (
    <div className="flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={() => props.setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-900/10 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* <PromptBar /> */}

        <div className="ml-auto flex items-center gap-x-4 lg:gap-x-6">
          {/* <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
          </button>

          <div
            className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-900/10"
            aria-hidden="true"
          /> */}

          <ProfileDropdown />
        </div>
      </div>
    </div>
  );
}

export function ProfileDropdown() {
  const { data: session, status } = useSession();

  if (session?.user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex data-[state=open]:bg-muted">
            <div className="flex">
              {!!session.user.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="m-2 h-8 w-8 rounded-full bg-gray-50"
                  src={session.user.image}
                  alt=""
                />
              )}
              <span className="hidden lg:flex lg:items-center">
                <span
                  className="ml-2 text-sm font-semibold leading-6 text-foreground"
                  aria-hidden="true"
                >
                  {session.user.name}
                </span>
                <ChevronDownIcon
                  className="ml-2 h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </div>
          </Button>
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
    );
  }

  return null;
}
