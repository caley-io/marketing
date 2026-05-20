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

interface AccountSwitcherProps {
  isCollapsed: boolean;
  accounts: {
    id?: string;
    label: string;
    email: string;
    icon: React.ReactNode;
  }[];
  selectedAccountId?: string | null;
  onSelectAccount?: (accountId: string) => void;
}

export function AccountSwitcher({
  isCollapsed,
  accounts,
  selectedAccountId,
  onSelectAccount,
}: AccountSwitcherProps) {
  const fallbackAccountId = accounts[0]?.id || accounts[0]?.email;
  const [localSelectedAccount, setLocalSelectedAccount] = React.useState<
    string | undefined
  >(fallbackAccountId);
  const selectedAccount = selectedAccountId || localSelectedAccount;

  React.useEffect(() => {
    if (!selectedAccount && fallbackAccountId) {
      setLocalSelectedAccount(fallbackAccountId);
      onSelectAccount?.(fallbackAccountId);
    }
  }, [fallbackAccountId, onSelectAccount, selectedAccount]);

  if (!accounts.length) {
    return (
      <Select disabled>
        <SelectTrigger
          className={cn(
            "flex items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
            isCollapsed &&
              "flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden",
          )}
          aria-label="No accounts"
        >
          <SelectValue placeholder={isCollapsed ? "" : "No accounts"} />
        </SelectTrigger>
      </Select>
    );
  }

  const selectedValue =
    selectedAccount || fallbackAccountId || accounts[0].email;
  const selectedAccountDetails = accounts.find(
    (account) => (account.id || account.email) === selectedValue,
  );

  return (
    <Select
      value={selectedValue}
      onValueChange={(accountId) => {
        setLocalSelectedAccount(accountId);
        onSelectAccount?.(accountId);
      }}
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
          {selectedAccountDetails?.icon}
          <span className={cn("ml-2", isCollapsed && "hidden")}>
            {selectedAccountDetails?.label}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {accounts.map((account) => (
          <SelectItem
            key={account.id || account.email}
            value={account.id || account.email}
          >
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
