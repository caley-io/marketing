import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { withError } from "@/utils/middleware";
import {
  paginationQuerySchema,
  reconcileEmailThreads,
  generateMockPaginationBatch,
} from "@/utils/emailPagination";

export const dynamic = "force-dynamic";

export const GET = withError(async (request: Request) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const pageToken = searchParams.get("pageToken") || undefined;

  // Generate paginated batch based on requested offset
  const batch = generateMockPaginationBatch(offset, limit);

  return NextResponse.json({
    threads: batch,
    nextOffset: offset + batch.length,
    nextPageToken: pageToken ? `token-${offset + batch.length}` : `page-token-${offset + batch.length}`,
    hasMore: offset + batch.length < 300,
    totalEstimate: 300,
  });
});
