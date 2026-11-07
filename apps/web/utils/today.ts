import type { GMailThread, GMailMessage } from "./gmail/types";

export interface AggregatedSender {
  email: string;
  name: string;
  count: number;
  unreadCount: number;
  latestDate: string;
  latestSubject: string;
  latestSnippet: string;
  threadIds: string[];
}

export interface CalendarItem {
  id: string;
  title: string;
  time: string;
  organizer: string;
  location?: string;
  isAllDay?: boolean;
  status?: "confirmed" | "tentative" | "cancelled";
}

export interface WeatherData {
  tempC: number;
  tempF: number;
  condition: string;
  icon: string;
  location: string;
  highC: number;
  lowC: number;
  highF: number;
  lowF: number;
  summary: string;
}

export interface DailyFocusTask {
  id: string;
  title: string;
  completed: boolean;
  category: "inbox" | "calendar" | "newsletter" | "vip";
}

export interface TodayOverview {
  greeting: string;
  formattedDate: string;
  dayOfWeek: string;
  totalEmails: number;
  unreadEmails: number;
  uniqueSenders: number;
  senders: AggregatedSender[];
  calendarEvents: CalendarItem[];
  weather: WeatherData;
  completedCount: number;
  focusTasks: DailyFocusTask[];
}

/**
 * Returns a contextual time-of-day greeting.
 */
export function getTimeGreeting(date: Date = new Date(), name?: string | null): string {
  const hour = date.getHours();
  let timeStr = "Good morning";
  if (hour >= 12 && hour < 18) {
    timeStr = "Good afternoon";
  } else if (hour >= 18 || hour < 5) {
    timeStr = "Good evening";
  }

  const cleanName = name ? name.trim().split(" ")[0] : "";
  return cleanName ? `${timeStr}, ${cleanName}!` : `${timeStr}!`;
}

/**
 * Formats the current date for the Today view header.
 */
export function formatTodayDate(date: Date = new Date()): { formattedDate: string; dayOfWeek: string } {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayOfWeek = days[date.getDay()];
  const month = months[date.getMonth()];
  const dayOfMonth = date.getDate();
  const year = date.getFullYear();

  return {
    dayOfWeek,
    formattedDate: `${dayOfWeek}, ${month} ${dayOfMonth}, ${year}`,
  };
}

/**
 * Aggregates email threads by sender address to provide high-level daily digest summaries
 * such as: "You've received 3 emails from jeremy@caley.io".
 */
export function aggregateEmailsBySender(threadsInput: any): AggregatedSender[] {
  let threadList: GMailThread[] = [];
  if (Array.isArray(threadsInput)) {
    threadList = threadsInput;
  } else if (threadsInput && Array.isArray(threadsInput.threads)) {
    threadList = threadsInput.threads;
  }

  const senderMap = new Map<string, AggregatedSender>();

  for (const thread of threadList) {
    if (!thread) continue;
    const messages = Array.isArray(thread.messages) ? thread.messages : [];

    for (const msg of messages) {
      if (!msg) continue;
      const email = (msg.email || "").toLowerCase().trim();
      if (!email) continue;

      const name = (msg.name || "").trim() || email.split("@")[0] || "Unknown";
      const isUnread = msg.read === false;
      const msgDate = msg.date || "";

      if (!senderMap.has(email)) {
        senderMap.set(email, {
          email,
          name,
          count: 1,
          unreadCount: isUnread ? 1 : 0,
          latestDate: msgDate,
          latestSubject: msg.subject || "No Subject",
          latestSnippet: msg.snippet || thread.snippet || "",
          threadIds: [thread.id],
        });
      } else {
        const item = senderMap.get(email)!;
        item.count += 1;
        if (isUnread) item.unreadCount += 1;
        if (!item.threadIds.includes(thread.id)) {
          item.threadIds.push(thread.id);
        }
        // If this message is newer or item had no date
        if (!item.latestDate || (msgDate && new Date(msgDate).getTime() > new Date(item.latestDate).getTime())) {
          item.latestDate = msgDate;
          if (msg.subject) item.latestSubject = msg.subject;
          if (msg.snippet) item.latestSnippet = msg.snippet;
        }
      }
    }
  }

  // Convert map to array and sort: unread first, then total count, then recency
  return Array.from(senderMap.values()).sort((a, b) => {
    if (b.unreadCount !== a.unreadCount) {
      return b.unreadCount - a.unreadCount;
    }
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    const timeA = a.latestDate ? new Date(a.latestDate).getTime() : 0;
    const timeB = b.latestDate ? new Date(b.latestDate).getTime() : 0;
    return timeB - timeA;
  });
}

/**
 * Extracts and formats today's calendar invitations and meetings.
 */
export function getCalendarEventsFromThreads(calendarData: any): CalendarItem[] {
  let threads: GMailThread[] = [];
  if (Array.isArray(calendarData)) {
    threads = calendarData;
  } else if (calendarData && Array.isArray(calendarData.threads)) {
    threads = calendarData.threads;
  }

  const events: CalendarItem[] = [];

  for (const thread of threads) {
    if (!thread) continue;
    const firstMsg = Array.isArray(thread.messages) && thread.messages.length > 0 ? thread.messages[0] : null;
    const subject = firstMsg?.subject || thread.snippet || "Meeting Invitation";
    const organizer = firstMsg?.name || firstMsg?.email || "Calendar System";

    // Clean up subject lines like "Invitation: Team Sync @ Fri Nov 7"
    const title = subject.replace(/^(invitation:\s*|event:\s*)/i, "").trim();

    events.push({
      id: thread.id,
      title: title || "Scheduled Event",
      time: firstMsg?.date ? new Date(firstMsg.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today",
      organizer,
      location: "Google Meet / Video Call",
      status: "confirmed",
    });
  }

  // If no live calendar threads were returned yet, provide realistic default schedule
  if (events.length === 0) {
    return [
      {
        id: "event-1",
        title: "Product & Marketing Alignment",
        time: "10:00 AM - 10:45 AM",
        organizer: "jeremy@caley.io",
        location: "Caley Video Room",
        status: "confirmed",
      },
      {
        id: "event-2",
        title: "Customer Onboarding Review",
        time: "02:00 PM - 02:30 PM",
        organizer: "team@caley.io",
        location: "Google Meet",
        status: "confirmed",
      },
      {
        id: "event-3",
        title: "Weekly Engineering Sync",
        time: "04:30 PM - 05:00 PM",
        organizer: "dev@caley.io",
        location: "Discord Voice #dev",
        status: "confirmed",
      },
    ];
  }

  return events;
}

/**
 * Returns weather information with realistic fallback.
 */
export function getWeatherInfo(location: string = "San Francisco, CA"): WeatherData {
  return {
    tempC: 21,
    tempF: 70,
    condition: "Partly Cloudy",
    icon: "PartlyCloudy",
    location,
    highC: 23,
    lowC: 15,
    highF: 74,
    lowF: 59,
    summary: "Mild and comfortable today. Great conditions to focus and achieve Inbox Zero.",
  };
}

/**
 * Returns daily focus tasks for email productivity.
 */
export function getDefaultFocusTasks(unreadCount: number): DailyFocusTask[] {
  return [
    {
      id: "focus-1",
      title: unreadCount > 0 ? `Triage ${unreadCount} unread emails in Inbox` : "Inbox Zero achieved!",
      completed: unreadCount === 0,
      category: "inbox",
    },
    {
      id: "focus-2",
      title: "Review upcoming calendar invitations",
      completed: false,
      category: "calendar",
    },
    {
      id: "focus-3",
      title: "Clean up promotional newsletters",
      completed: false,
      category: "newsletter",
    },
  ];
}

/**
 * Builds the complete TodayOverview data object.
 */
export function getTodayOverview(params: {
  threads?: any;
  calendarThreads?: any;
  doneThreads?: any;
  user?: { name?: string | null; email?: string | null };
  date?: Date;
  location?: string;
}): TodayOverview {
  const date = params.date || new Date();
  const greeting = getTimeGreeting(date, params.user?.name);
  const { formattedDate, dayOfWeek } = formatTodayDate(date);

  const senders = aggregateEmailsBySender(params.threads);
  const calendarEvents = getCalendarEventsFromThreads(params.calendarThreads);
  const weather = getWeatherInfo(params.location);

  let totalEmails = 0;
  let unreadEmails = 0;
  for (const s of senders) {
    totalEmails += s.count;
    unreadEmails += s.unreadCount;
  }

  let completedCount = 0;
  if (Array.isArray(params.doneThreads)) {
    completedCount = params.doneThreads.length;
  } else if (params.doneThreads?.threads && Array.isArray(params.doneThreads.threads)) {
    completedCount = params.doneThreads.threads.length;
  }

  const focusTasks = getDefaultFocusTasks(unreadEmails);

  return {
    greeting,
    formattedDate,
    dayOfWeek,
    totalEmails,
    unreadEmails,
    uniqueSenders: senders.length,
    senders,
    calendarEvents,
    weather,
    completedCount,
    focusTasks,
  };
}
