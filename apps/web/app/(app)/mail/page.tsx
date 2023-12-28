"use client";

import { accounts } from "@/components/mail/data";
import { Mail } from "@/components/mail/components/mail";
// import { Filters, getFilterFunction } from "@/utils/filters";
// import { usePromptContext } from "@/providers/PromptProvider";

export default function MailPage() {
  // const layout = cookies().get('react-resizable-panels:layout');
  //   const collapsed = cookies().get('react-resizable-panels:collapsed');

  //   const defaultLayout = layout ? JSON.parse(layout.value) : undefined;
  //   const defaultCollapsed = collapsed ? JSON.parse(collapsed.value) : undefined;
  return (
    <Mail
      accounts={accounts}
      defaultLayout={undefined}
      defaultCollapsed={undefined}
      navCollapsedSize={4}
    />
  );
}
