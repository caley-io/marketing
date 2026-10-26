import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    workspaces: [
      {
        id: "default-workspace",
        name: "Personal Workspace",
        role: "owner",
      },
    ],
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { name } = body;
  if (!name) {
    return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });
  }
  return NextResponse.json({
    workspace: {
      id: `workspace-${Date.now()}`,
      name,
      role: "owner",
    },
  });
}
