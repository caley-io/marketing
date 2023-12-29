"use client";

import { accounts } from "@/components/mail/data";
import { Mail } from "@/components/mail/components/mail";

export default function MailPage() {
  return (
    <Mail
      accounts={accounts}
      defaultLayout={undefined}
      defaultCollapsed={undefined}
      navCollapsedSize={4}
    />
  );
}
