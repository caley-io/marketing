import React from "react";
import { SessionProvider } from "@/providers/SessionProvider";
import { SWRProvider } from "@/providers/SWRProvider";
import { StatLoaderProvider } from "@/providers/StatLoaderProvider";
import { WorkspaceProvider } from "@/providers/WorkspaceProvider";

export default function Providers(props: { children: React.ReactNode }) {
  return (
    <SWRProvider>
      <WorkspaceProvider>
        <SessionProvider>
          <StatLoaderProvider>{props.children}</StatLoaderProvider>
        </SessionProvider>
      </WorkspaceProvider>
    </SWRProvider>
  );
}
