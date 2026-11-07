"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  X,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAtom } from "jotai";
import {
  calendarSidebarOpenAtom,
  calendarTargetDateAtom,
  calendarEventsAtom,
} from "@/utils/store";
import { CalendarEvent } from "@/utils/calendar";

export const CalendarSidebar = () => {
  const [open, setOpen] = useAtom(calendarSidebarOpenAtom);
  const [targetDate, setTargetDate] = useAtom(calendarTargetDateAtom);
  const [events] = useAtom(calendarEventsAtom);

  const [fullScreen, setFullScreen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>("all");

  if (!open) return null;

  // Selected date or today
  const activeDate = targetDate ? new Date(targetDate) : new Date();
  const dateStr = activeDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedDateKey = activeDate.toISOString().split("T")[0];

  // Filter events matching active date and account scope
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
    <div
      className={
        fullScreen
          ? "fixed inset-0 z-50 bg-background/95 backdrop-blur flex flex-col p-6 overflow-hidden animate-in fade-in"
          : "fixed top-0 right-0 h-full w-96 z-40 bg-background border-l shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right"
      }
    >
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-sky-500" />
          <h2 className="font-bold text-sm">
            {fullScreen ? "Full Calendar View" : "Calendar & Agenda"}
          </h2>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFullScreen(!fullScreen)}
            title={fullScreen ? "Exit Fullscreen" : "Fullscreen"}
            className="h-8 w-8"
          >
            {fullScreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            title="Close (Shift+C)"
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Date Navigation Bar */}
      <div className="flex items-center justify-between p-3 bg-muted/40 border-b">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevDay}
            className="h-7 w-7"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextDay}
            className="h-7 w-7"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="h-7 text-xs px-2"
          >
            Today
          </Button>
        </div>

        <span className="text-xs font-semibold">{dateStr}</span>
      </div>

      {/* Multi-Account Scope Filter */}
      <div className="px-4 py-2 border-b flex items-center gap-1.5 overflow-x-auto text-xs">
        <span className="text-muted-foreground text-[11px] font-medium mr-1">
          Account:
        </span>
        <button
          onClick={() => setSelectedAccount("all")}
          className={`px-2 py-0.5 rounded text-xs transition-colors ${
            selectedAccount === "all"
              ? "bg-sky-500 text-white font-medium"
              : "bg-muted hover:bg-muted/80 text-foreground"
          }`}
        >
          All Accounts
        </button>
        <button
          onClick={() => setSelectedAccount("jeremy@caley.io")}
          className={`px-2 py-0.5 rounded text-xs transition-colors ${
            selectedAccount === "jeremy@caley.io"
              ? "bg-sky-500 text-white font-medium"
              : "bg-muted hover:bg-muted/80 text-foreground"
          }`}
        >
          Caley Workspace
        </button>
        <button
          onClick={() => setSelectedAccount("scatignaj@gmail.com")}
          className={`px-2 py-0.5 rounded text-xs transition-colors ${
            selectedAccount === "scatignaj@gmail.com"
              ? "bg-sky-500 text-white font-medium"
              : "bg-muted hover:bg-muted/80 text-foreground"
          }`}
        >
          Personal Gmail
        </button>
      </div>

      {/* Agenda Events List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center space-y-2 text-muted-foreground">
            <CalendarIcon className="h-8 w-8 text-muted-foreground/60" />
            <p className="text-sm font-medium">No scheduled events</p>
            <p className="text-xs">
              You are completely free on this day!
            </p>
          </div>
        ) : (
          filteredEvents.map((event) => {
            const start = new Date(event.startTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            const end = new Date(event.endTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={event.id}
                className="p-3.5 rounded-lg border bg-card hover:border-sky-400/60 transition-all space-y-2 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-xs leading-snug">
                    {event.title}
                  </h4>
                  <Badge
                    variant="secondary"
                    className="text-[10px] py-0 px-1.5 shrink-0 bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"
                  >
                    {event.accountLabel}
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                  <Clock className="h-3.5 w-3.5 text-sky-500" />
                  <span>
                    {start} - {end}
                  </span>
                </div>

                {event.location && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{event.location}</span>
                  </div>
                )}

                {event.meetingUrl && (
                  <a
                    href={event.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-700 font-medium pt-1"
                  >
                    <Video className="h-3.5 w-3.5" />
                    <span>Join Video Meeting</span>
                  </a>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer shortcut helper */}
      <div className="p-3 border-t bg-muted/20 text-center text-[11px] text-muted-foreground">
        Press <kbd className="px-1.5 py-0.5 rounded border bg-background text-[10px] font-mono">Shift+C</kbd> to toggle calendar anywhere
      </div>
    </div>
  );
};
