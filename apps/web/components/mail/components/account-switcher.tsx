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
import { useAtom } from "jotai";
import { selectedAccountEmailAtom } from "@/utils/store";
import { Layers } from "lucide-react";

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
  const [selectedAccount, setSelectedAccount] = useAtom(
    selectedAccountEmailAtom,
  );

  const selectedItem =
    selectedAccount === "all"
      ? null
      : accounts.find((account) => account.email === selectedAccount);

  return (
    <Select
      value={selectedAccount}
      onValueChange={(val) => setSelectedAccount(val)}
    >
      <SelectTrigger
        className={cn(
          "flex items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
          isCollapsed &&
            "flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden",
        )}
        aria-label="Select account"
      >
        <SelectValue placeholder="Select an account">
          {selectedAccount === "all" ? (
            <Layers className="h-4 w-4 text-sky-500" />
          ) : (
            selectedItem?.icon
          )}
          <span className={cn("ml-2", isCollapsed && "hidden")}>
            {selectedAccount === "all"
              ? "All Accounts"
              : selectedItem?.label || selectedAccount}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          <div className="flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 font-medium text-sky-600 dark:text-sky-400">
            <Layers className="h-4 w-4" />
            All Accounts (Full Search)
          </div>
        </SelectItem>
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
