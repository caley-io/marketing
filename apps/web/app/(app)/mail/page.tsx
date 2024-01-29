import { accounts } from "@/components/mail/data";
import { Mail } from "@/components/mail/components/mail";
import { cookies } from "next/headers";

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
