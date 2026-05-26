import { auth } from "@/app/api/auth/[...nextauth]/auth";
import prisma from "@/utils/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(80),
  image: z.string().url().optional().nullable(),
  invitedMembers: z
    .array(
      z.object({
        name: z.string().trim().max(80).optional(),
        email: z
          .string()
          .trim()
          .email()
          .max(255)
          .transform((email) => email.toLowerCase()),
        role: z.enum(["ADMIN", "USER"]).default("USER"),
      }),
    )
    .max(10)
    .refine(
      (members) =>
        new Set(members.map((member) => member.email)).size === members.length,
      "Invited members must have unique email addresses",
    )
    .optional(),
  emailAccounts: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        email: z
          .string()
          .trim()
          .email()
          .max(255)
          .transform((email) => email.toLowerCase()),
      }),
    )
    .max(10)
    .refine(
      (accounts) =>
        new Set(accounts.map((account) => account.email)).size ===
        accounts.length,
      "Email accounts must have unique email addresses",
    )
    .optional(),
});

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id },
    include: {
      organization: {
        include: {
          membership: {
            select: {
              id: true,
              role: true,
              invitedName: true,
              invitedEmail: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
            orderBy: { id: "asc" },
          },
          emailAccounts: {
            select: {
              id: true,
              name: true,
              email: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
    orderBy: { id: "asc" },
  });

  return NextResponse.json({
    workspaces: memberships.map((membership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
      image: membership.organization.image,
      role: membership.role,
      members: membership.organization.membership,
      emailAccounts: membership.organization.emailAccounts,
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const parsed = createWorkspaceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid workspace payload" },
      { status: 400 },
    );
  }

  const workspace = await prisma.organization.create({
    data: {
      name: parsed.data.name,
      image: parsed.data.image || null,
      emailAccounts: parsed.data.emailAccounts?.length
        ? {
            create: parsed.data.emailAccounts.map((emailAccount) => ({
              name: emailAccount.name,
              email: emailAccount.email,
            })),
          }
        : undefined,
      membership: {
        create: [
          {
            role: "OWNER",
            userId: session.user.id,
          },
          ...(parsed.data.invitedMembers ?? []).map((invitedMember) => ({
            role: invitedMember.role,
            invitedName: invitedMember.name || null,
            invitedEmail: invitedMember.email,
          })),
        ],
      },
    },
    include: {
      membership: {
        select: {
          id: true,
          role: true,
          invitedName: true,
          invitedEmail: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
      emailAccounts: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json(
    {
      workspace: {
        id: workspace.id,
        name: workspace.name,
        image: workspace.image,
        role: "OWNER",
        members: workspace.membership,
        emailAccounts: workspace.emailAccounts,
      },
    },
    { status: 201 },
  );
}
