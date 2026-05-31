import { z } from "zod";
import he from "he";
import { NextResponse } from "next/server";
import { parseMessages } from "@/utils/mail";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import {
  getGmailAccessToken,
  getGmailClient,
  getGmailClientForEmailAccount,
} from "@/utils/gmail/client";
import { getPlan } from "@/utils/redis/plan";
import { INBOX_LABEL_ID, getGmailLabels } from "@/utils/label";
import { ThreadWithPayloadMessages } from "@/utils/types";
import prisma from "@/utils/prisma";
import { getCategory } from "@/utils/redis/category";
import { getThreadsBatch, parseGmailApiResponse } from "@/utils/gmail/thread";
import { withError } from "@/utils/middleware";
import { createGmailLabel } from "./archive/controller";
import { getEmailSummary } from "@/utils/langbase";
import { getWorkspaceEmailAccountForUser } from "@/utils/workspace";

export const dynamic = "force-dynamic";

export const maxDuration = 30;

const threadsQuery = z.object({
  fromEmail: z.string().nullish(),
  limit: z.coerce.number().max(100).nullish(),
  includeAll: z.coerce.boolean().nullish(),
  isDone: z.coerce.boolean().nullish(),
  isTeam: z.coerce.boolean().nullish(),
  isCalendar: z.coerce.boolean().nullish(),
  isSent: z.coerce.boolean().nullish(),
  workspaceId: z.string().nullish(),
  emailAccountId: z.string().nullish(),
});
export type ThreadsQuery = z.infer<typeof threadsQuery>;
export type ThreadsResponse = Awaited<ReturnType<typeof getThreads>>;

async function getThreads(query: ThreadsQuery) {
  const session = await auth();
  const email = session?.user.email;

  if (!email) throw new Error("Not authenticated");

  let gmail = getGmailClient(session);
  let token = await getGmailAccessToken(session);
  let accessToken = token?.token;
  let mailboxEmail = email;

  if (query.workspaceId) {
    const { emailAccount } = await getWorkspaceEmailAccountForUser({
      userId: session.user.id,
      workspaceId: query.workspaceId,
      emailAccountId: query.emailAccountId,
    });

    if (!emailAccount) return { threads: [] };

    const scopedGmail = await getGmailClientForEmailAccount(emailAccount);
    gmail = scopedGmail.gmail;
    accessToken = scopedGmail.accessToken;
    mailboxEmail = emailAccount.email;
  }

  if (!accessToken) throw new Error("Missing access token");
  const emailDomain = mailboxEmail.split("@")[1];

  const gmailLabels = await getGmailLabels(gmail);

  let doneLabel = gmailLabels?.find((label) => label.name === "DONE");

  if (!doneLabel) {
    doneLabel = await createGmailLabel({
      name: "DONE",
      gmail,
    });
  }

  if (!doneLabel?.id || !doneLabel?.name)
    throw new Error("Could not create DONE label");

  const buildQuery = () => {
    if (query.isCalendar) {
      return `has:attachment ics`;
    } else if (query.isTeam) {
      return `from:*@${emailDomain}`;
    }
  };

  const buildLabelIds = () => {
    if (query.isDone) {
      if (!doneLabel?.id) throw new Error("Missing DONE label");
      return [doneLabel.id];
    } else if (query.isSent) {
      return ["SENT"];
    } else {
      return [INBOX_LABEL_ID];
    }
  };

  const [gmailThreads, rules] = await Promise.all([
    gmail.users.threads.list({
      userId: "me",
      labelIds: buildLabelIds(),
      maxResults: query.limit || 50,
      q: query.isTeam || query.isCalendar ? buildQuery() : undefined,
    }),
    prisma.rule.findMany({ where: { userId: session.user.id } }),
  ]);

  // may have been faster not using batch method, but doing 50 getMessages in parallel
  const threads = await getThreadsBatch(
    gmailThreads.data.threads?.map((thread) => thread.id!) || [],
    accessToken,
  );

  const threadsWithMessages = await Promise.all(
    threads.map(async (thread) => {
      const id = thread.id!;
      const messages = parseMessages(thread as ThreadWithPayloadMessages);

      const messagesAsGMailMessage = messages.map((message) => {
        return parseGmailApiResponse({
          ...message,
        });
      });

      // const summary = await getEmailSummary(messagesAsGMailMessage[0].text);
      // console.log("summary", summary);

      const plan = await getPlan({ userId: session.user.id, threadId: id });
      const rule = plan
        ? rules.find((r) => r.id === plan?.rule?.id)
        : undefined;

      return {
        id: thread.id,
        historyId: thread.historyId,
        messages: messagesAsGMailMessage,
        snippet: he.decode(thread.snippet || ""),
        plan: plan ? { ...plan, databaseRule: rule } : undefined,
        category: await getCategory({ email: mailboxEmail, threadId: id }),
      };
    }) || [],
  );

  return { threads: threadsWithMessages };
}

export const GET = withError(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit");
  const fromEmail = searchParams.get("fromEmail");
  const includeAll = searchParams.get("includeAll");
  const isDone = searchParams.get("isDone");
  const isTeam = searchParams.get("isTeam");
  const isCalendar = searchParams.get("isCalendar");
  const isSent = searchParams.get("isSent");
  const workspaceId = searchParams.get("workspaceId");
  const emailAccountId = searchParams.get("emailAccountId");
  const query = threadsQuery.parse({
    limit,
    fromEmail,
    includeAll,
    isDone,
    isTeam,
    isCalendar,
    isSent,
    workspaceId,
    emailAccountId,
  });

  const threads = await getThreads(query);
  return NextResponse.json(threads);
});
