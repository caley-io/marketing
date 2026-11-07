import { z } from "zod";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  organizer: string;
  organizerEmail?: string;
  attendees?: string[];
  location?: string;
  accountEmail: string;
  accountLabel: string;
  isAllDay?: boolean;
  status: "confirmed" | "tentative" | "cancelled";
  meetingUrl?: string;
}

export const calendarEventSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Event title required"),
  description: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  organizer: z.string(),
  organizerEmail: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  location: z.string().optional(),
  accountEmail: z.string(),
  accountLabel: z.string(),
  isAllDay: z.boolean().optional(),
  status: z.enum(["confirmed", "tentative", "cancelled"]).default("confirmed"),
  meetingUrl: z.string().optional(),
});

export const calendarQuerySchema = z.object({
  accountEmail: z.string().optional().default("all"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CalendarQuery = z.infer<typeof calendarQuerySchema>;

/**
 * Filter events by account and date range.
 */
export function filterCalendarEvents(
  events: CalendarEvent[],
  query: CalendarQuery,
): CalendarEvent[] {
  let filtered = events;

  if (query.accountEmail && query.accountEmail !== "all") {
    filtered = filtered.filter(
      (e) => e.accountEmail.toLowerCase() === query.accountEmail?.toLowerCase(),
    );
  }

  if (query.startDate) {
    const start = new Date(query.startDate).getTime();
    filtered = filtered.filter((e) => new Date(e.endTime).getTime() >= start);
  }

  if (query.endDate) {
    const end = new Date(query.endDate).getTime();
    filtered = filtered.filter((e) => new Date(e.startTime).getTime() <= end);
  }

  // Sort ascending by startTime
  return filtered.sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
}

/**
 * Groups events by Day string (e.g. "2026-11-07")
 */
export function groupEventsByDay(
  events: CalendarEvent[],
): Record<string, CalendarEvent[]> {
  const grouped: Record<string, CalendarEvent[]> = {};

  for (const event of events) {
    const day = event.startTime.split("T")[0] || "Unknown";
    if (!grouped[day]) {
      grouped[day] = [];
    }
    grouped[day].push(event);
  }

  return grouped;
}

/**
 * Mock multi-account calendar events spanning connected workspaces and personal accounts.
 */
export function getDefaultMultiAccountEvents(baseDate: Date = new Date()): CalendarEvent[] {
  const yyyy = baseDate.getFullYear();
  const mm = String(baseDate.getMonth() + 1).padStart(2, "0");
  const dd = String(baseDate.getDate()).padStart(2, "0");

  const todayStr = `${yyyy}-${mm}-${dd}`;

  return [
    {
      id: "cal-ev-1",
      title: "Product Roadmap & Sprint Planning",
      description: "Discuss quarterly product goals and upcoming releases.",
      startTime: `${todayStr}T09:30:00.000Z`,
      endTime: `${todayStr}T10:30:00.000Z`,
      organizer: "Jeremy Scatigna",
      organizerEmail: "jeremy@caley.io",
      attendees: ["team@caley.io", "dev@caley.io"],
      location: "Google Meet",
      accountEmail: "jeremy@caley.io",
      accountLabel: "Caley Workspace",
      status: "confirmed",
      meetingUrl: "https://meet.google.com/abc-defg-hij",
    },
    {
      id: "cal-ev-2",
      title: "Client Partnership Review",
      description: "Quarterly business review and SLA confirmation with Client X.",
      startTime: `${todayStr}T13:00:00.000Z`,
      endTime: `${todayStr}T14:00:00.000Z`,
      organizer: "Client Success",
      organizerEmail: "success@enterprise.com",
      attendees: ["jeremy@caley.io", "executive@enterprise.com"],
      location: "Zoom Meeting",
      accountEmail: "jeremy@caley.io",
      accountLabel: "Caley Workspace",
      status: "confirmed",
      meetingUrl: "https://zoom.us/j/987654321",
    },
    {
      id: "cal-ev-3",
      title: "Personal Fitness Training",
      description: "Weekly workout session with personal trainer.",
      startTime: `${todayStr}T17:30:00.000Z`,
      endTime: `${todayStr}T18:30:00.000Z`,
      organizer: "Personal Calendar",
      organizerEmail: "scatignaj@gmail.com",
      location: "Downtown Gym",
      accountEmail: "scatignaj@gmail.com",
      accountLabel: "Personal Gmail",
      status: "confirmed",
    },
    {
      id: "cal-ev-4",
      title: "Investor Update Call",
      description: "Monthly sync on metrics, MRR growth, and roadmap execution.",
      startTime: `${todayStr}T20:00:00.000Z`,
      endTime: `${todayStr}T20:45:00.000Z`,
      organizer: "Roelof Botha",
      organizerEmail: "investor@venture.co",
      attendees: ["jeremy@magnet.wtf"],
      location: "Caley Video Room",
      accountEmail: "jeremy@magnet.wtf",
      accountLabel: "Magnet WTF",
      status: "confirmed",
      meetingUrl: "https://caley.io/video/room-investor",
    },
  ];
}
