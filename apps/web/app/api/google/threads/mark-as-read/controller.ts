import { z } from "zod";
import { getGmailClient } from "@/utils/gmail/client";
import { auth } from "@/app/api/auth/[...nextauth]/auth";

export const markAsReadBody = z.object({ id: z.string() });
export type MarkAsReadBody = z.infer<typeof markAsReadBody>;
export type MarkAsReadResponse = Awaited<ReturnType<typeof markAsRead>>;

export async function markAsRead(body: MarkAsReadBody) {
  const session = await auth();
  if (!session?.user.email) throw new Error("Not authenticated");

  const gmail = getGmailClient(session);

  const thread = await gmail.users.threads.modify({
    userId: "me",
    id: body.id,
    requestBody: {
      removeLabelIds: ["UNREAD"],
    },
  });

  return { thread };
}
