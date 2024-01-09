"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";

import { cn } from "@/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tab, Tabs } from "@/utils/store";

interface NavProps {
  isCollapsed: boolean;
  selectedTab: string;
  setSelectedTab: (tab: Tabs) => void;
  links: Tab[];
}

export function Nav({
  links,
  isCollapsed,
  selectedTab,
  setSelectedTab,
}: NavProps) {
  return (
    <div
      data-collapsed={isCollapsed}
      className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2"
    >
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {links.map((link, index) =>
          isCollapsed ? (
            <Tooltip key={index} delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setSelectedTab(link.title)}
                  size={"icon"}
                  variant={selectedTab === link.title ? "default" : "ghost"}
                >
                  <link.icon className="h-4 w-4" />
                  <span className="sr-only">{link.title}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-4">
                {link.title}
                {link.label && (
                  <span className="ml-auto text-muted-foreground">
                    {link.label}
                  </span>
                )}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              key={index}
              size={"sm"}
              variant={selectedTab === link.title ? "default" : "ghost"}
              onClick={() => setSelectedTab(link.title)}
              className="justify-start"
            >
              <link.icon className="mr-2 h-4 w-4" />
              {link.title}
              {link.label && (
                <span
                  className={cn(
                    "ml-auto",
                    selectedTab === link.title &&
                      "text-background dark:text-background",
                  )}
                >
                  {link.label}
                </span>
              )}
            </Button>
          ),
        )}
      </nav>
    </div>
  );
}
