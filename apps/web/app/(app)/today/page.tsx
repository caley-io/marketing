"use client";

import React, { useEffect } from "react";
import { accounts } from "@/components/mail/data";
import { Mail } from "@/components/mail/components/mail";
import { useSetAtom } from "jotai";
import { tabAtom } from "@/utils/store";

export default function TodayPage() {
  const setSelectedTab = useSetAtom(tabAtom);

  useEffect(() => {
    setSelectedTab("Today");
  }, [setSelectedTab]);

  return (
    <Mail
      accounts={accounts}
      defaultLayout={undefined}
      defaultCollapsed={undefined}
      navCollapsedSize={4}
    />
  );
}
