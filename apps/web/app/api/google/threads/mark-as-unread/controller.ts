import { z } from "zod";
import { getGmailClient } from "@/utils/gmail/client";
import { auth } from "@/app/api/auth/[...nextauth]/auth";

export const markAsUnreadBody = z.object({ id: z.string() });
export type MarkAsUnreadBody = z.infer<typeof markAsUnreadBody>;
export type MarkAsUnreadResponse = Awaited<ReturnType<typeof markAsUnread>>;
export async function markAsUnread(body: MarkAsUnreadBody) {
  const session = await auth();
  if (!session?.user.email) throw new Error("Not authenticated");

  const gmail = getGmailClient(session);
  const thread = await gmail.users.threads.modify({
    userId: "me",
    id: body.id,
    requestBody: {
      addLabelIds: ["UNREAD"],
    },
  });

  return { thread };
}
