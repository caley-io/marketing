"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  CloudSun,
  Inbox,
  Mail,
  Pencil,
  Sparkles,
  Users,
  ArrowRight,
  CheckSquare,
  Square,
  RefreshCw,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizablePanel } from "@/components/ui/resizable";
import { useSetAtom } from "jotai";
import { openComposeAtom, tabAtom } from "@/utils/store";
import {
  getTodayOverview,
  AggregatedSender,
  CalendarItem,
  DailyFocusTask,
} from "@/utils/today";

interface TodayViewProps {
  threadsData?: any;
  calendarData?: any;
  doneData?: any;
  isLoading?: boolean;
}

export function TodayView({
  threadsData,
  calendarData,
  doneData,
  isLoading = false,
}: TodayViewProps) {
  const setTab = useSetAtom(tabAtom);
  const setComposeOpen = useSetAtom(openComposeAtom);

  const overview = useMemo(() => {
    return getTodayOverview({
      threads: threadsData,
      calendarThreads: calendarData,
      doneThreads: doneData,
    });
  }, [threadsData, calendarData, doneData]);

  const [tasks, setTasks] = useState<DailyFocusTask[]>(overview.focusTasks);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  const getInitials = (name: string, email: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    return email ? email.slice(0, 2).toUpperCase() : "EM";
  };

  return (
    <ResizablePanel defaultSize={1095} className="h-screen bg-background">
      <ScrollArea className="h-full">
        <div className="mx-auto max-w-6xl space-y-6 p-6">
          {/* Top Hero Banner */}
          <div className="flex flex-col justify-between gap-4 rounded-xl border bg-gradient-to-r from-card to-muted/40 p-6 shadow-sm md:flex-row md:items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Today's Daily Briefing
                </span>
              </div>
              <h1 className="font-cal text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {overview.greeting}
              </h1>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {overview.formattedDate}
              </p>
            </div>

            {/* Weather & Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border bg-background/80 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur">
                <CloudSun className="h-4 w-4 text-amber-500" />
                <span className="font-semibold text-foreground">
                  {overview.weather.tempC}°C / {overview.weather.tempF}°F
                </span>
                <span>• {overview.weather.condition}</span>
                <span className="flex items-center gap-0.5 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {overview.weather.location}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTab("Inbox")}
                  className="gap-1.5"
                >
                  <Inbox className="h-4 w-4" />
                  Inbox ({overview.unreadEmails})
                </Button>
                <Button
                  size="sm"
                  onClick={() => setComposeOpen(true)}
                  className="gap-1.5"
                >
                  <Pencil className="h-4 w-4" />
                  Compose
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Metrics KPI Bar */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card className="cursor-pointer transition-colors hover:border-primary/50" onClick={() => setTab("Inbox")}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{overview.unreadEmails}</div>
                  <div className="text-xs text-muted-foreground">Unread Messages</div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer transition-colors hover:border-primary/50" onClick={() => setTab("Inbox")}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{overview.uniqueSenders}</div>
                  <div className="text-xs text-muted-foreground">Senders Today</div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer transition-colors hover:border-primary/50" onClick={() => setTab("Calendar")}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{overview.calendarEvents.length}</div>
                  <div className="text-xs text-muted-foreground">Scheduled Events</div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer transition-colors hover:border-primary/50" onClick={() => setTab("Done")}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{overview.completedCount}</div>
                  <div className="text-xs text-muted-foreground">Processed / Done</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main 2-Column Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column (2 Cols): Aggregated Emails by Sender & Quick Tasks */}
            <div className="space-y-6 lg:col-span-2">
              {/* Aggregated Senders ("You've received N emails from sender") */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">
                        People Reaching Out
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Aggregated incoming emails grouped by sender
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {overview.uniqueSenders} active contacts
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {overview.senders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                      <Inbox className="mb-2 h-8 w-8 stroke-1 text-muted-foreground/60" />
                      <p className="text-sm font-medium">Your inbox is clear for today</p>
                      <p className="text-xs">No active incoming senders to triage.</p>
                    </div>
                  ) : (
                    overview.senders.map((sender: AggregatedSender) => (
                      <div
                        key={sender.email}
                        className="group flex flex-col justify-between gap-3 rounded-lg border bg-card p-3.5 transition-all hover:border-primary/40 hover:bg-muted/30 sm:flex-row sm:items-center"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-9 w-9 shrink-0 border">
                            <AvatarFallback className="bg-primary/5 text-xs font-semibold text-primary">
                              {getInitials(sender.name, sender.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">
                                {sender.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                &lt;{sender.email}&gt;
                              </span>
                            </div>
                            <p className="text-xs font-medium text-primary">
                              You've received {sender.count}{" "}
                              {sender.count === 1 ? "email" : "emails"} from{" "}
                              {sender.email}
                              {sender.unreadCount > 0 && ` (${sender.unreadCount} unread)`}
                            </p>
                            {sender.latestSubject && (
                              <p className="line-clamp-1 text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground/80">
                                  Latest:
                                </span>{" "}
                                {sender.latestSubject}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setTab("Inbox")}
                            className="h-8 gap-1 text-xs"
                          >
                            View
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Daily Focus & Inbox Goals */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">
                        Daily Focus
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Key action items to complete today
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className="flex cursor-pointer items-center justify-between rounded-md border p-2.5 transition-colors hover:bg-muted/40"
                    >
                      <div className="flex items-center gap-2.5">
                        {task.completed ? (
                          <CheckSquare className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span
                          className={`text-xs ${
                            task.completed
                              ? "text-muted-foreground line-through"
                              : "font-medium text-foreground"
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {task.category}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Column (1 Col): Today's Calendar & Outlook */}
            <div className="space-y-6">
              {/* Today's Calendar */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">
                        Today's Calendar
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Upcoming meetings and events
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setTab("Calendar")}
                      className="h-7 px-2 text-xs"
                    >
                      View all
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {overview.calendarEvents.map((event: CalendarItem) => (
                    <div
                      key={event.id}
                      className="space-y-1.5 rounded-lg border bg-muted/20 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-xs text-foreground line-clamp-1">
                          {event.title}
                        </span>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {event.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-muted-foreground">
                          with {event.organizer}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
                            Join
                            <ExternalLink className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Weather & Day Outlook */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">
                    Weather & Outlook
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Local climate snapshot
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex items-center justify-between rounded-lg border bg-gradient-to-br from-amber-500/10 to-transparent p-3">
                    <div className="space-y-0.5">
                      <div className="text-2xl font-bold">
                        {overview.weather.tempC}°C{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          / {overview.weather.tempF}°F
                        </span>
                      </div>
                      <div className="text-xs font-medium text-foreground">
                        {overview.weather.condition}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        High {overview.weather.highC}°C · Low {overview.weather.lowC}°C
                      </div>
                    </div>
                    <CloudSun className="h-10 w-10 text-amber-500/80" />
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {overview.weather.summary}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ScrollArea>
    </ResizablePanel>
  );
}
