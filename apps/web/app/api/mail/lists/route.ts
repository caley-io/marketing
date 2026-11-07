import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { withError } from "@/utils/middleware";
import {
  createEmailListRequestSchema,
  defaultCustomLists,
  CustomEmailList,
} from "@/utils/emailLists";

export const dynamic = "force-dynamic";

export const GET = withError(async () => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({ lists: defaultCustomLists });
});

export const POST = withError(async (request: Request) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = createEmailListRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid list data", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const newList: CustomEmailList = {
    id: `list-${Date.now()}`,
    name: parsed.data.name,
    description: parsed.data.description,
    rules: parsed.data.rules || [],
    manualThreadIds: [],
  };

  return NextResponse.json({ list: newList });
});
