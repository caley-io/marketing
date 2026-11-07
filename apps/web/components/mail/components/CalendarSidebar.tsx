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
  CheckCircle2,
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
            title="Close sidebar"
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Date Header & Controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b">
        <Button variant="outline" size="sm" onClick={handleToday} className="h-7 text-xs">
          Today
        </Button>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handlePrevDay} className="h-7 w-7">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-semibold px-1">{dateStr}</span>
          <Button variant="ghost" size="icon" onClick={handleNextDay} className="h-7 w-7">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Account Filter */}
      <div className="flex items-center gap-1 px-4 py-2 border-b overflow-x-auto text-[11px] bg-muted/20">
        <span className="text-muted-foreground mr-1">Filter:</span>
        {["all", "jeremy@caley.io", "scatignaj@gmail.com", "jeremy@magnet.wtf"].map(
          (acc) => (
            <button
              key={acc}
              onClick={() => setSelectedAccount(acc)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                selectedAccount === acc
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {acc === "all" ? "All" : acc.split("@")[0]}
            </button>
          ),
        )}
      </div>

      {/* Event List / Schedule */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>{filteredEvents.length} events scheduled</span>
          {targetDate && (
            <Badge variant="secondary" className="text-[10px]">
              Focused Date
            </Badge>
          )}
        </div>

        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border rounded-lg border-dashed">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2 opacity-80" />
            <p className="text-xs font-semibold text-foreground">You are completely free!</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              No meetings or conflicting events scheduled for this day.
            </p>
          </div>
        ) : (
          filteredEvents.map((event) => {
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
                className="p-3 border rounded-lg bg-card shadow-sm space-y-2 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-xs text-card-foreground">
                      {event.title}
                    </h3>
                    <span className="text-[10px] text-muted-foreground">
                      {event.accountLabel}
                    </span>
                  </div>
                  {event.meetingUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] px-2 flex items-center gap-1"
                      onClick={() => window.open(event.meetingUrl, "_blank")}
                    >
                      <Video className="h-3 w-3 text-sky-500" />
                      Join
                    </Button>
                  )}
                </div>

                {event.description && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {event.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground pt-1 border-t">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {startTime} - {endTime}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
