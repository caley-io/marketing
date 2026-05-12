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
  onAccountChange?: (accountId: string) => void;
}

export function AccountSwitcher({
  isCollapsed,
  accounts,
  selectedAccountId,
  onAccountChange,
}: AccountSwitcherProps) {
  const fallbackAccountId = accounts[0]?.id ?? accounts[0]?.email ?? "";
  const [internalAccountId, setInternalAccountId] =
    React.useState(fallbackAccountId);
  const selectedAccount =
    selectedAccountId ?? internalAccountId ?? fallbackAccountId;
  const selectedAccountOption = accounts.find(
    (account) => (account.id ?? account.email) === selectedAccount,
  );

  React.useEffect(() => {
    const selectedAccountExists = accounts.some(
      (account) => (account.id ?? account.email) === internalAccountId,
    );
    if (!selectedAccountExists) setInternalAccountId(fallbackAccountId);
  }, [accounts, fallbackAccountId, internalAccountId]);

  return (
    <Select
      value={selectedAccount}
      onValueChange={(value) => {
        setInternalAccountId(value);
        onAccountChange?.(value);
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
          {selectedAccountOption?.icon}
          <span className={cn("ml-2", isCollapsed && "hidden")}>
            {selectedAccountOption?.label}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {accounts.map((account) => (
          <SelectItem
            key={account.id ?? account.email}
            value={account.id ?? account.email}
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
