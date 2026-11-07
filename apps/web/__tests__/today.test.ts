import assert from "node:assert";
import { describe, it } from "node:test";
import {
  getTimeGreeting,
  formatTodayDate,
  aggregateEmailsBySender,
  getCalendarEventsFromThreads,
  getWeatherInfo,
  getDefaultFocusTasks,
  getTodayOverview,
} from "../utils/today.ts";

describe("today utils", () => {
  describe("getTimeGreeting", () => {
    it("returns morning greeting between 5:00 and 11:59", () => {
      const morningDate = new Date("2026-11-07T08:30:00");
      assert.strictEqual(getTimeGreeting(morningDate, "Jeremy"), "Good morning, Jeremy!");
      assert.strictEqual(getTimeGreeting(morningDate), "Good morning!");
    });

    it("returns afternoon greeting between 12:00 and 17:59", () => {
      const afternoonDate = new Date("2026-11-07T14:15:00");
      assert.strictEqual(getTimeGreeting(afternoonDate, "Alice Smith"), "Good afternoon, Alice!");
      assert.strictEqual(getTimeGreeting(afternoonDate), "Good afternoon!");
    });

    it("returns evening greeting after 18:00 or before 05:00", () => {
      const eveningDate = new Date("2026-11-07T20:00:00");
      assert.strictEqual(getTimeGreeting(eveningDate, "Bob"), "Good evening, Bob!");

      const lateNightDate = new Date("2026-11-07T02:00:00");
      assert.strictEqual(getTimeGreeting(lateNightDate), "Good evening!");
    });
  });

  describe("formatTodayDate", () => {
    it("formats day of week and full date string", () => {
      const testDate = new Date(2026, 10, 7); // Month 10 is November (0-indexed)
      const res = formatTodayDate(testDate);
      assert.strictEqual(res.dayOfWeek, "Saturday");
      assert.strictEqual(res.formattedDate, "Saturday, November 7, 2026");
    });
  });

  describe("aggregateEmailsBySender", () => {
    it("aggregates emails by sender and computes counts correctly", () => {
      const threads = [
        {
          id: "thread-1",
          snippet: "First email snippet",
          messages: [
            {
              id: "msg-1",
              name: "Jeremy Scatigna",
              email: "jeremy@caley.io",
              to: "me@caley.io",
              subject: "Roadmap discussion",
              snippet: "Can we talk about the roadmap?",
              date: "2026-11-07T07:00:00Z",
              read: false,
              labels: ["INBOX"],
              text: "",
              isHtmlEmail: false,
            },
            {
              id: "msg-2",
              name: "Jeremy Scatigna",
              email: "jeremy@caley.io",
              to: "me@caley.io",
              subject: "Re: Roadmap discussion",
              snippet: "Here is the updated doc.",
              date: "2026-11-07T08:00:00Z",
              read: true,
              labels: ["INBOX"],
              text: "",
              isHtmlEmail: false,
            },
          ],
        },
        {
          id: "thread-2",
          snippet: "Another email",
          messages: [
            {
              id: "msg-3",
              name: "Jeremy Scatigna",
              email: "jeremy@caley.io",
              to: "me@caley.io",
              subject: "Quick question",
              snippet: "Are you free today?",
              date: "2026-11-07T08:30:00Z",
              read: false,
              labels: ["INBOX"],
              text: "",
              isHtmlEmail: false,
            },
            {
              id: "msg-4",
              name: "Sarah Conner",
              email: "sarah@techcorp.com",
              to: "me@caley.io",
              subject: "Invoice #1042",
              snippet: "Please find attached invoice.",
              date: "2026-11-07T06:00:00Z",
              read: true,
              labels: ["INBOX"],
              text: "",
              isHtmlEmail: false,
            },
          ],
        },
      ];

      const senders = aggregateEmailsBySender(threads);
      assert.strictEqual(senders.length, 2);

      // Jeremy should be first because of higher unread count (2 unread vs 0)
      const jeremy = senders[0];
      assert.strictEqual(jeremy.email, "jeremy@caley.io");
      assert.strictEqual(jeremy.name, "Jeremy Scatigna");
      assert.strictEqual(jeremy.count, 3);
      assert.strictEqual(jeremy.unreadCount, 2);
      assert.strictEqual(jeremy.latestSubject, "Quick question");
      assert.deepStrictEqual(jeremy.threadIds, ["thread-1", "thread-2"]);

      const sarah = senders[1];
      assert.strictEqual(sarah.email, "sarah@techcorp.com");
      assert.strictEqual(sarah.count, 1);
      assert.strictEqual(sarah.unreadCount, 0);
    });

    it("handles empty or malformed thread lists gracefully", () => {
      assert.deepStrictEqual(aggregateEmailsBySender([]), []);
      assert.deepStrictEqual(aggregateEmailsBySender(null), []);
      assert.deepStrictEqual(aggregateEmailsBySender(undefined), []);
      assert.deepStrictEqual(aggregateEmailsBySender({ threads: [] }), []);
    });
  });

  describe("getCalendarEventsFromThreads", () => {
    it("parses calendar threads or provides default schedule", () => {
      const defaultEvents = getCalendarEventsFromThreads([]);
      assert.strictEqual(defaultEvents.length >= 2, true);
      assert.strictEqual(typeof defaultEvents[0].title, "string");

      const customThreads = [
        {
          id: "cal-1",
          snippet: "Sync meeting",
          messages: [
            {
              id: "m-1",
              name: "Design Lead",
              email: "design@caley.io",
              to: "me@caley.io",
              subject: "Invitation: UX Review @ 3pm",
              snippet: "Let's review the new today view",
              date: "2026-11-07T15:00:00Z",
              read: true,
              labels: ["CALENDAR"],
              text: "",
              isHtmlEmail: false,
            },
          ],
        },
      ];

      const events = getCalendarEventsFromThreads(customThreads);
      assert.strictEqual(events.length, 1);
      assert.strictEqual(events[0].title, "UX Review @ 3pm");
      assert.strictEqual(events[0].organizer, "Design Lead");
    });
  });

  describe("getWeatherInfo", () => {
    it("returns weather info object with valid temperature and summary", () => {
      const weather = getWeatherInfo("Paris, France");
      assert.strictEqual(weather.location, "Paris, France");
      assert.strictEqual(typeof weather.tempC, "number");
      assert.strictEqual(typeof weather.tempF, "number");
      assert.strictEqual(weather.condition.length > 0, true);
      assert.strictEqual(weather.summary.length > 0, true);
    });
  });

  describe("getTodayOverview", () => {
    it("compiles aggregated overview data", () => {
      const overview = getTodayOverview({
        threads: [
          {
            id: "t-1",
            messages: [
              {
                id: "m-1",
                email: "support@caley.io",
                name: "Caley Support",
                subject: "Welcome aboard",
                read: false,
                date: "2026-11-07T09:00:00Z",
              },
            ],
          },
        ],
        user: { name: "Jeremy Scatigna" },
        date: new Date("2026-11-07T09:00:00"),
      });

      assert.strictEqual(overview.greeting, "Good morning, Jeremy!");
      assert.strictEqual(overview.totalEmails, 1);
      assert.strictEqual(overview.unreadEmails, 1);
      assert.strictEqual(overview.uniqueSenders, 1);
      assert.strictEqual(overview.senders[0].email, "support@caley.io");
      assert.strictEqual(overview.calendarEvents.length >= 1, true);
      assert.strictEqual(overview.weather.condition, "Partly Cloudy");
      assert.strictEqual(overview.focusTasks.length >= 1, true);
    });
  });
});
