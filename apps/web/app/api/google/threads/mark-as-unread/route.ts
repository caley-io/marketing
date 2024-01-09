import { NextResponse } from "next/server";
import { withError } from "@/utils/middleware";
import { markAsUnread, markAsUnreadBody } from "./controller";

export const POST = withError(async (request: Request) => {
  const json = await request.json();
  const body = markAsUnreadBody.parse(json);

  const thread = await markAsUnread(body);
  return NextResponse.json(thread);
});
