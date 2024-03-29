import { NextResponse } from "next/server";
import he from "he";
import sortBy from "lodash/sortBy";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { getGmailClient } from "@/utils/gmail/client";
import { getPlans } from "@/utils/redis/plan";
import { parseMessage } from "@/utils/mail";
import { isDefined } from "@/utils/types";
import { getMessage } from "@/utils/gmail/message";
import { getCategory } from "@/utils/redis/category";
import prisma from "@/utils/prisma";
import { withError } from "@/utils/middleware";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // TODO not great if this is taking more than 15s

const LIMIT = 50;

export type PlannedResponse = Awaited<ReturnType<typeof getPlanned>>;

// overlapping code with apps/web/app/api/google/threads/route.ts
async function getPlanned(): Promise<{ messages: any }> {
  const session = await auth();
  if (!session?.user.email) throw new Error("Not authenticated");

  const allPlans = await getPlans({ userId: session.user.id });
  console.log(`Fetched ${allPlans.length} plans`);
  const plans = take(allPlans, LIMIT);

  const gmail = getGmailClient(session);

  const rules = await prisma.rule.findMany({
    where: { userId: session.user.id },
  });

  // should we fetch threads instead here?
  const messages = await Promise.all(
    plans.map(async (plan) => {
      if (!plan.rule) return;
      try {
        const [message, category] = await Promise.all([
          getMessage(plan.messageId, gmail),
          getCategory({
            email: session.user.email!,
            threadId: plan.threadId,
          }),
        ]);

        const rule = plan
          ? rules.find((r) => r.id === plan?.rule?.id)
          : undefined;

        const thread = {
          id: message.threadId,
          historyId: message.historyId,
          snippet: he.decode(message.snippet || ""),
          messages: [],
          plan: plan ? { ...plan, databaseRule: rule } : undefined,
          category,
        };

        return thread;
      } catch (error) {
        console.error("getPlanned: error getting message", error);
      }
    }),
  );

  return { messages: messages.filter(isDefined) };
}

function take<T extends { createdAt: Date }>(array: T[], count: number) {
  return sortBy(array, (x) => -new Date(x.createdAt)).slice(0, count);
}

export const GET = withError(async () => {
  const messages = await getPlanned();
  return NextResponse.json(messages);
});
