import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { email, role, workspaceId } = await req.json();
  if (!email || !role || !workspaceId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  return NextResponse.json({
    success: true,
    invitation: { email, role, workspaceId, status: "pending" },
  });
}
