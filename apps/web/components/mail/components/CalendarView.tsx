"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  PanelRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResizablePanel } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAtom } from "jotai";
import {
  calendarSidebarOpenAtom,
  calendarTargetDateAtom,
  calendarEventsAtom,
} from "@/utils/store";
import { CalendarEvent } from "@/utils/calendar";

interface CalendarViewProps {
  defaultLayout?: number[];
}

export function CalendarView({ defaultLayout }: CalendarViewProps) {
  const [sidebarOpen, setSidebarOpen] = useAtom(calendarSidebarOpenAtom);
  const [targetDate, setTargetDate] = useAtom(calendarTargetDateAtom);
  const [events] = useAtom(calendarEventsAtom);

  const [selectedAccount, setSelectedAccount] = useState<string>("all");

  const activeDate = targetDate ? new Date(targetDate) : new Date();
  const dateStr = activeDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const formattedDateKey = activeDate.toISOString().split("T")[0];

  const filteredEvents = events.filter((e) => {
    const eventDay = e.startTime.split("T")[0];
    const matchesDay = eventDay === formattedDateKey;
    const matchesAccount =
      selectedAccount === "all" ||
      e.accountEmail.toLowerCase() === selectedAccount.toLowerCase();
    return matchesDay && matchesAccount;
  });

  const handlePrevDay = () => {
    const prev = new Date(activeDate);
    prev.setDate(prev.getDate() - 1);
    setTargetDate(prev.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const next = new Date(activeDate);
    next.setDate(next.getDate() + 1);
    setTargetDate(next.toISOString().split("T")[0]);
  };

  const handleToday = () => {
    setTargetDate(new Date().toISOString().split("T")[0]);
  };

  return (
    <ResizablePanel defaultSize={defaultLayout ? defaultLayout[1] + defaultLayout[2] : 1095} className="h-screen flex flex-col bg-background">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-6 w-6 text-sky-500" />
          <div>
            <h1 className="text-xl font-bold">Multi-Account Calendar</h1>
            <p className="text-xs text-muted-foreground">
              Aggregated schedule across all connected Google & Workspace accounts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-1.5"
          >
            <PanelRight className="h-4 w-4" />
            <span>Open Sidebar (Shift+C)</span>
          </Button>
        </div>
      </div>

      {/* Date controls and Account Filter */}
      <div className="flex flex-wrap items-center justify-between px-6 py-3 border-b bg-muted/20 gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={handlePrevDay} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-sm px-2">{dateStr}</span>
            <Button variant="ghost" size="icon" onClick={handleNextDay} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Account Selector Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-muted-foreground mr-1">Account:</span>
          {["all", "jeremy@caley.io", "scatignaj@gmail.com", "jeremy@magnet.wtf"].map(
            (acc) => (
              <button
                key={acc}
                onClick={() => setSelectedAccount(acc)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedAccount === acc
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {acc === "all" ? "All Accounts" : acc}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Event Schedule Content */}
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Scheduled Events ({filteredEvents.length})
            </h2>
            <span className="text-xs text-muted-foreground">
              Shortcut: press <kbd className="px-1.5 py-0.5 border rounded bg-muted">Shift+C</kbd> to toggle right sidebar
            </span>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed">
              <CalendarIcon className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
              <h3 className="font-medium text-sm">No events scheduled</h3>
              <p className="text-xs text-muted-foreground mt-1">
                You have no scheduled meetings for this date under the selected account scope.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredEvents.map((event) => {
                const startTime = new Date(event.startTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const endTime = new Date(event.endTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={event.id}
                    className="p-4 border rounded-xl hover:border-primary/50 transition-colors bg-card shadow-sm space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-base">{event.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {event.accountLabel}
                          </Badge>
                        </div>
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>

                      {event.meetingUrl && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => window.open(event.meetingUrl, "_blank")}
                          className="shrink-0 flex items-center gap-1.5"
                        >
                          <Video className="h-3.5 w-3.5 text-sky-500" />
                          <span>Join Meeting</span>
                        </Button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1 border-t">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {startTime} - {endTime}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {event.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        Organizer: {event.organizer}
                      </span>
                      <span className="text-xs text-muted-foreground/80">
                        {event.accountEmail}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </ResizablePanel>
  );
}
