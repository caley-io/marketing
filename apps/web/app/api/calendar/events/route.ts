import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { withError } from "@/utils/middleware";
import {
  calendarQuerySchema,
  getDefaultMultiAccountEvents,
  filterCalendarEvents,
} from "@/utils/calendar";

export const dynamic = "force-dynamic";

export const GET = withError(async (request: Request) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const accountEmail = searchParams.get("accountEmail") || "all";
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  const query = calendarQuerySchema.parse({
    accountEmail,
    startDate,
    endDate,
  });

  const allEvents = getDefaultMultiAccountEvents();
  const events = filterCalendarEvents(allEvents, query);

  return NextResponse.json({
    events,
    total: events.length,
    accountScope: query.accountEmail,
  });
});
