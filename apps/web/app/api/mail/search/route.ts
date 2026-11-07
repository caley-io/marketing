import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { withError } from "@/utils/middleware";
import {
  multiAccountSearchSchema,
  parseSearchQuery,
  searchMultiAccountThreads,
  SearchableThread,
} from "@/utils/fullSearch";

export const dynamic = "force-dynamic";

export const POST = withError(async (request: Request) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = multiAccountSearchSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid search query", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { query, accountEmail } = parsed.data;

  // Multi-account search query
  const searchResults = {
    query,
    accountScope: accountEmail || "all",
    results: [],
    totalMatches: 0,
    matchesByAccount: {},
  };

  return NextResponse.json(searchResults);
});
