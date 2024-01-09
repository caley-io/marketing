import { NextResponse } from "next/server";
import { withError } from "@/utils/middleware";
import { markAsRead, markAsReadBody } from "./controller";

export const POST = withError(async (request: Request) => {
  const json = await request.json();
  const body = markAsReadBody.parse(json);

  const thread = await markAsRead(body);
  return NextResponse.json(thread);
});
