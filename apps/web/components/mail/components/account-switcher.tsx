"use client";

import * as React from "react";

import { cn } from "@/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getNavbarDisplayMode } from "@/utils/resizableNavbar";

interface AccountSwitcherProps {
  isCollapsed: boolean;
  accounts: {
    label: string;
    email: string;
    icon: React.ReactNode;
  }[];
}

export function AccountSwitcher({
  isCollapsed,
  accounts,
}: AccountSwitcherProps) {
  const [selectedAccount, setSelectedAccount] = React.useState<string>(
    accounts[0]?.email ?? "",
  );

  const activeAccount =
    accounts.find((account) => account.email === selectedAccount) ??
    accounts[0];
  const displayMode = getNavbarDisplayMode(isCollapsed);

  return (
    <Select defaultValue={selectedAccount} onValueChange={setSelectedAccount}>
      <SelectTrigger
        data-mode={displayMode}
        className={cn(
          "flex items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
          isCollapsed &&
            "flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden",
        )}
        aria-label="Select account"
      >
        <SelectValue placeholder="Select an account">
          {activeAccount?.icon}
          {!isCollapsed && (
            <span className="ml-2 truncate">{activeAccount?.label}</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {accounts.map((account) => (
          <SelectItem key={account.email} value={account.email}>
            <div className="flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground">
              {account.icon}
              {account.email}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
