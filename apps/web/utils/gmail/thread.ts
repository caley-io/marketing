import { getBatch } from "@/utils/gmail/batch";
import { GMailMessage } from "@/utils/gmail/types";
import { gmail_v1 } from "googleapis";

export async function getThread(threadId: string, gmail: gmail_v1.Gmail) {
  const thread = await gmail.users.threads.get({
    userId: "me",
    id: threadId,
  });

  return thread.data;
}

export async function getThreadsBatch(
  threadIds: string[],
  accessToken: string,
): Promise<gmail_v1.Schema$Thread[]> {
  const batch = await getBatch(
    threadIds,
    "/gmail/v1/users/me/threads",
    accessToken,
  );

  return batch;
}

export function parseGmailApiResponse(apiResponse: any) {
  const headers = apiResponse.parsedMessage.headers;
  const from = headers["from"];
  const to = headers["to"];
  const subject = headers["subject"];
  const references = headers["references"] || "";
  const inReplyTo = headers["in-reply-to"] || "";
  const messageId = headers["message-id"] || "";

  const htmlPart = apiResponse.parsedMessage.textHtml;
  const textPart = apiResponse.parsedMessage.textPlain;

  const hasListUnsubscribe = !!headers["List-Unsubscribe"];

  // Check for bulk mail label
  const isBulkMail =
    apiResponse.labelIds.includes("CATEGORY_PROMOTIONS") ||
    apiResponse.labelIds.includes("CATEGORY_UPDATES") ||
    from?.includes("no-reply@") ||
    from?.includes("noreply@") ||
    from?.includes("no_reply@") ||
    from?.includes("noreply@") ||
    from?.includes("notifications") ||
    from?.includes("notification") ||
    from?.includes("info@") ||
    from?.includes("info.");

  const isHtmlEmail = htmlPart && (hasListUnsubscribe || isBulkMail);
  const text = isHtmlEmail ? htmlPart : textPart;

  const date = headers["date"];
  const read = !apiResponse.labelIds.includes("UNREAD");

  return {
    id: apiResponse.id,
    name: from?.split("<")[0], // You might want to parse this to get a more readable name
    email: from,
    to: to,
    subject: subject,
    snippet: apiResponse.snippet,
    text: text,
    isHtmlEmail: isHtmlEmail,
    date: date,
    read: read,
    labels: apiResponse.labelIds,
    references: references,
    inReplyTo: inReplyTo,
    messageId: messageId,
  } as GMailMessage;
}
