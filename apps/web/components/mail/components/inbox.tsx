"use client";
import * as React from "react";
import { Search } from "lucide-react";

import { MailDisplay } from "./mail-display";
import { MailList } from "./mail-list";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
import { GMailMessage } from "@/utils/gmail/types";
import { DataDisplayComponent } from "@/components/mail/components/mail";
import { useAtomValue } from "jotai";
import { configAtom } from "@/utils/store";

export function Inbox({ data, isLoading, error, defaultLayout }: any) {
  const mail = useAtomValue(configAtom);
  return (
    <>
      <ResizablePanel
        defaultSize={defaultLayout[1]}
        minSize={30}
        className="h-screen"
      >
        <Tabs defaultValue="all">
          <div className="flex items-center px-4 py-2">
            <h1 className="text-xl font-bold">Inbox</h1>
            <TabsList className="ml-auto">
              <TabsTrigger
                value="all"
                className="text-zinc-600 dark:text-zinc-200"
              >
                All mail
              </TabsTrigger>
              <TabsTrigger
                value="unread"
                className="text-zinc-600 dark:text-zinc-200"
              >
                Unread
              </TabsTrigger>
            </TabsList>
          </div>
          <Separator />
          <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <form>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search" className="pl-8" />
              </div>
            </form>
          </div>
          <TabsContent value="all" className="m-0">
            <DataDisplayComponent
              isLoading={isLoading}
              error={error}
              data={data}
              renderContent={(data) => <MailList items={data.messages} />}
            />
          </TabsContent>
          <TabsContent value="unread" className="m-0">
            <DataDisplayComponent
              isLoading={isLoading}
              error={error}
              data={data}
              renderContent={(data) => (
                <MailList
                  items={data.messages.filter(
                    (item: GMailMessage) => !item.read,
                  )}
                />
              )}
            />
          </TabsContent>
        </Tabs>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={defaultLayout[2]} className="h-screen">
        {mail.selected === null ||
        isLoading ||
        error ||
        data.messages.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No message selected
          </div>
        ) : (
          <MailDisplay
            mail={
              data.messages.find(
                (item: GMailMessage) => item.id === mail.selected,
              ) || null
            }
          />
        )}
      </ResizablePanel>
    </>
  );
}
