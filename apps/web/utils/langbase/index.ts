import { env } from "@/env.mjs";
import prisma from "@/utils/prisma";
import { auth } from "@/app/api/auth/[...nextauth]/auth";

export async function setOrCreateEmailSummary(
  message: string,
  threadId: string,
) {
  const session = await auth();

  if (!session?.user.email) throw new Error("Not authenticated");

  const summary = prisma.summary.findUniqueOrThrow({
    where: { threadId },
  });

  if (summary) {
    return summary;
  }

  const newSummary = await getEmailSummary(message);

  prisma.summary.create({
    data: {
      threadId,
      summary: newSummary,
      userId: session.user.id,
    },
  });

  return newSummary;
}

export async function setOrCreateEmailActionItems(
  message: string,
  threadId: string,
) {
  const session = await auth();

  if (!session?.user.email) throw new Error("Not authenticated");

  const actionItems = prisma.actionItem.findMany({
    where: { threadId },
  });

  if (actionItems) {
    return actionItems;
  }

  const newActionItems = await getEmailActionItems(message);

  newActionItems.actions.forEach((item: string) => {
    prisma.actionItem.create({
      data: {
        threadId,
        content: item,
        userId: session.user.id,
      },
    });
  });

  return newActionItems.actions;
}

export async function setOrCreateEmailCategories(
  message: string,
  threadId: string,
) {
  const session = await auth();

  if (!session?.user.email) throw new Error("Not authenticated");

  const categories = prisma.category.findMany({
    where: { threadId },
  });

  if (categories) {
    return categories;
  }

  const newCategories = await getEmailCategories(message);

  newCategories.labels.forEach((category: string) => {
    prisma.category.create({
      data: {
        threadId,
        name: category,
        userId: session.user.id,
      },
    });
  });

  return newCategories.labels;
}

export async function setOrCreateEmailUrgencyLevel(
  message: string,
  threadId: string,
) {
  const session = await auth();

  if (!session?.user.email) throw new Error("Not authenticated");

  const urgencyLevel = prisma.urgencyLevel.findUniqueOrThrow({
    where: { threadId },
  });

  if (urgencyLevel) {
    return urgencyLevel;
  }

  const newUrgencyLevel = await getEmailUrgencyLevel(message);

  prisma.urgencyLevel.create({
    data: {
      threadId,
      level: newUrgencyLevel.urgency.toUpperCase(),
      userId: session.user.id,
    },
  });

  return newUrgencyLevel.urgency.toUpperCase();
}

export async function getEmailSummary(message: string) {
  const res = await fetch(env.LANGBASE_URL, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${env.LANGBASE_SUMMARIES_SECRET}`,
    },
    method: "POST",
    body: JSON.stringify({ prompt: message }),
  });

  return res.json();
}

export async function getEmailActionItems(message: string) {
  const res = await fetch(env.LANGBASE_URL, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${env.LANGBASE_ACTIONS_SECRET}`,
    },
    method: "POST",
    body: JSON.stringify({ prompt: message }),
  });

  return res.json();
}

export async function getEmailCategories(message: string) {
  const res = await fetch(env.LANGBASE_URL, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${env.LANGBASE_CATEGORIES_SECRET}`,
    },
    method: "POST",
    body: JSON.stringify({ prompt: message }),
  });

  return res.json();
}

export async function getEmailUrgencyLevel(message: string) {
  const res = await fetch(env.LANGBASE_URL, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${env.LANGBASE_URGENT_SECRET}`,
    },
    method: "POST",
    body: JSON.stringify({ prompt: message }),
  });

  return res.json();
}
