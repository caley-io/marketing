import "../../styles/globals.css";
import React from "react";
import { redirect } from "next/navigation";
import { TokenCheck } from "@/components/TokenCheck";
import Providers from "@/app/(app)/providers";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { PostHogIdentify } from "@/providers/PostHogProvider";
import { CommandK } from "@/components/CommandK";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { ComposeDialog } from "./compose/ComposeDialog";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user.email) redirect("/login");

  return (
    <Providers>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <PostHogIdentify />
        <TokenCheck />
        <CommandK />
        <Toaster />
        <ComposeDialog />
        {children}
      </ThemeProvider>
    </Providers>
  );
}
