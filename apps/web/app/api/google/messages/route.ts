import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { getGmailClient } from "@/utils/gmail/client";
import { parseMessage } from "@/utils/mail";
import { getMessage } from "@/utils/gmail/message";
import { withError } from "@/utils/middleware";
import { GMailMessage } from "@/utils/gmail/types";

export type MessagesResponse = Awaited<ReturnType<typeof getMessages>>;

function parseGmailApiResponse(apiResponse: any) {
  const headers = apiResponse.parsedMessage.headers;
  const from = headers["from"];
  const to = headers["to"];
  const subject = headers["subject"];

  const htmlPart = apiResponse.parsedMessage.textHtml;
  const textPart = apiResponse.parsedMessage.textPlain;

  const isHtmlEmail = !!htmlPart;
  const text = isHtmlEmail ? htmlPart : textPart;

  const date = new Date(
    parseInt(apiResponse.internalDate),
  ).toLocaleDateString();
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
  } as GMailMessage;
}

async function getMessages() {
  const session = await auth();
  if (!session) throw new Error("Not authenticated");

  const gmail = getGmailClient(session);

  const messages = await gmail.users.messages.list({
    userId: "me",
    maxResults: 10,
  });

  const fullMessages = await Promise.all(
    (messages.data.messages || []).map(async (m) => {
      const res = await getMessage(m.id!, gmail);

      return parseGmailApiResponse({
        ...res,
        parsedMessage: parseMessage(res),
      });
    }),
  );

  return { messages: fullMessages };
}

export const GET = withError(async () => {
  const result = await getMessages();

  return NextResponse.json(result);
});
