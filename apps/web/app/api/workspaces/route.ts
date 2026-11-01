```ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma";

export async function GET(request: NextRequest) {
  const organizations = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(organizations);
}

export async function POST(request: NextRequest) {
  const { name } = await request.json();

  if (!name) {
    return new NextResponse("Name required", { status: 400 });
  }

  const organization = await prisma.organization.create({
    data: { name },
  });

  return NextResponse.json(organization);
}
```