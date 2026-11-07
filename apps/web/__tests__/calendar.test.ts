import test from "node:test";
import assert from "node:assert/strict";
import {
  calendarEventSchema,
  calendarQuerySchema,
  filterCalendarEvents,
  groupEventsByDay,
  getDefaultMultiAccountEvents,
  type CalendarEvent,
} from "../utils/calendar.ts";

test("Calendar: schema validation for valid calendar event", () => {
  const event: CalendarEvent = {
    id: "test-event-1",
    title: "Quarterly Board Meeting",
    description: "Review financial statements and expansion plans",
    startTime: "2026-11-07T10:00:00.000Z",
    endTime: "2026-11-07T11:30:00.000Z",
    organizer: "Alex Smith",
    organizerEmail: "alex@caley.io",
    accountEmail: "jeremy@caley.io",
    accountLabel: "Caley Workspace",
    status: "confirmed",
    meetingUrl: "https://meet.google.com/xyz-123",
  };

  const parsed = calendarEventSchema.parse(event);
  assert.equal(parsed.id, "test-event-1");
  assert.equal(parsed.accountEmail, "jeremy@caley.io");
  assert.equal(parsed.status, "confirmed");
});

test("Calendar: schema fails when required title is empty", () => {
  const invalid = {
    id: "invalid-1",
    title: "",
    startTime: "2026-11-07T10:00:00.000Z",
    endTime: "2026-11-07T11:00:00.000Z",
    organizer: "Test",
    accountEmail: "test@example.com",
    accountLabel: "Test",
  };

  assert.throws(() => calendarEventSchema.parse(invalid));
});

test("Calendar: getDefaultMultiAccountEvents returns multi-account events", () => {
  const events = getDefaultMultiAccountEvents();
  assert.ok(events.length >= 4, "Should return at least 4 default events");

  const accounts = new Set(events.map((e) => e.accountEmail));
  assert.ok(accounts.has("jeremy@caley.io"), "Should include caley workspace account");
  assert.ok(accounts.has("scatignaj@gmail.com"), "Should include personal gmail account");
  assert.ok(accounts.has("jeremy@magnet.wtf"), "Should include secondary workspace account");
});

test("Calendar: filterCalendarEvents by accountEmail", () => {
  const events = getDefaultMultiAccountEvents();

  const caleyEvents = filterCalendarEvents(events, { accountEmail: "jeremy@caley.io" });
  assert.ok(caleyEvents.length > 0);
  assert.ok(caleyEvents.every((e) => e.accountEmail === "jeremy@caley.io"));

  const personalEvents = filterCalendarEvents(events, { accountEmail: "scatignaj@gmail.com" });
  assert.ok(personalEvents.length > 0);
  assert.ok(personalEvents.every((e) => e.accountEmail === "scatignaj@gmail.com"));

  const allEvents = filterCalendarEvents(events, { accountEmail: "all" });
  assert.equal(allEvents.length, events.length);
});

test("Calendar: filterCalendarEvents by date range", () => {
  const baseDate = new Date("2026-11-07T00:00:00.000Z");
  const events = getDefaultMultiAccountEvents(baseDate);

  const rangeFiltered = filterCalendarEvents(events, {
    accountEmail: "all",
    startDate: "2026-11-07T12:00:00.000Z",
    endDate: "2026-11-07T19:00:00.000Z",
  });

  assert.ok(rangeFiltered.length > 0);
  for (const ev of rangeFiltered) {
    assert.ok(new Date(ev.endTime).getTime() >= new Date("2026-11-07T12:00:00.000Z").getTime());
    assert.ok(new Date(ev.startTime).getTime() <= new Date("2026-11-07T19:00:00.000Z").getTime());
  }
});

test("Calendar: groupEventsByDay groups events correctly", () => {
  const events: CalendarEvent[] = [
    {
      id: "ev-1",
      title: "Morning Standup",
      startTime: "2026-11-07T09:00:00.000Z",
      endTime: "2026-11-07T09:30:00.000Z",
      organizer: "Scrum Master",
      accountEmail: "dev@caley.io",
      accountLabel: "Caley",
      status: "confirmed",
    },
    {
      id: "ev-2",
      title: "Architecture Review",
      startTime: "2026-11-07T14:00:00.000Z",
      endTime: "2026-11-07T15:00:00.000Z",
      organizer: "Lead Architect",
      accountEmail: "dev@caley.io",
      accountLabel: "Caley",
      status: "confirmed",
    },
    {
      id: "ev-3",
      title: "Tomorrow Breakfast",
      startTime: "2026-11-08T08:00:00.000Z",
      endTime: "2026-11-08T09:00:00.000Z",
      organizer: "Friend",
      accountEmail: "user@gmail.com",
      accountLabel: "Personal",
      status: "confirmed",
    },
  ];

  const grouped = groupEventsByDay(events);
  assert.equal(grouped["2026-11-07"].length, 2);
  assert.equal(grouped["2026-11-08"].length, 1);
  assert.equal(grouped["2026-11-07"][0].title, "Morning Standup");
});
