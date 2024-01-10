import { z } from "zod";
import { getGmailClient } from "@/utils/gmail/client";
import { INBOX_LABEL_ID, getGmailLabels } from "@/utils/label";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { gmail_v1 } from "googleapis";

export const archiveBody = z.object({ id: z.string() });
export type ArchiveBody = z.infer<typeof archiveBody>;
export type ArchiveResponse = Awaited<ReturnType<typeof archiveEmail>>;

export async function createGmailLabel(options: {
  name: string;
  gmail: gmail_v1.Gmail;
}) {
  const { name, gmail } = options;

  try {
    const res = await gmail.users.labels.create({
      userId: "me",
      requestBody: {
        name,
        color: {
          backgroundColor: "#000000",
          textColor: "#ffffff",
        },
        messageListVisibility: "hide",
        labelListVisibility: "labelShow",
      },
    });

    return res.data;
  } catch (error) {
    console.error("createGmailLabel error", error);
  }
}

export async function archiveEmail(body: ArchiveBody) {
  const session = await auth();
  if (!session?.user.email) throw new Error("Not authenticated");

  const gmail = getGmailClient(session);

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

  const thread = await gmail.users.threads.modify({
    userId: "me",
    id: body.id,
    requestBody: {
      addLabelIds: [doneLabel.id],
      removeLabelIds: [INBOX_LABEL_ID],
    },
  });

  return { thread };
}
