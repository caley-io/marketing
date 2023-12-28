export interface GMailMessage {
  id: string;
  name: string;
  email: string;
  to: string;
  subject: string;
  snippet: string;
  text: string;
  isHtmlEmail: boolean;
  date: string;
  read: boolean;
  labels: string[];
}

function decodeHtmlPart(parts: any) {
  // Check if parts is defined and is an array
  if (!parts || !Array.isArray(parts)) {
    return "";
  }

  const htmlPart = parts.find((part) => part.mimeType === "text/html");
  if (!htmlPart || !htmlPart.body || !htmlPart.body.data) {
    return "";
  }

  const base64Data = htmlPart.body.data.replace(/\-/g, "+").replace(/_/g, "/");
  if (typeof window !== "undefined") {
    return atob(base64Data);
  } else {
    return Buffer.from(base64Data, "base64").toString("utf-8");
  }
}

function decodeTextPart(parts: any) {
  if (!parts || !Array.isArray(parts)) {
    return "";
  }

  const textPart = parts.find((part) => part.mimeType === "text/plain");
  if (!textPart || !textPart.body || !textPart.body.data) {
    return "";
  }

  const base64Data = textPart.body.data.replace(/\-/g, "+").replace(/_/g, "/");
  if (typeof window !== "undefined") {
    return atob(base64Data);
  } else {
    return Buffer.from(base64Data, "base64").toString("utf-8");
  }
}

export const parseGmailMessagesToProperType = (messages: any) => {
  return messages.map((message: any) => {
    const { payload } = message;
    const { headers } = payload;

    const from = headers.find((header: any) => header.name === "From");
    const to = headers.find((header: any) => header.name === "To");
    const subject = headers.find((header: any) => header.name === "Subject");
    const fromName = from?.value.split("<")[0];
    const readStatus = !message.labelIds.includes("UNREAD");
    const date = new Date(parseInt(message.internalDate)).toLocaleDateString();

    console.log("[GMAIL MESSAGE]", message);

    const htmlContent = decodeHtmlPart(payload.parts);
    const textContent = decodeTextPart(payload.parts);
    const isHtmlEmail =
      !message.labelIds.includes("CHAT") ||
      !message.labelIds.includes("SENT") ||
      !message.labelIds.includes("DRAFT") ||
      !message.labelIds.includes("IMPORTANT") ||
      from?.value?.includes("no-reply") ||
      from?.value?.includes("hello") ||
      from?.value?.includes("support") ||
      from?.value?.includes("info") ||
      from?.value?.includes("contact") ||
      from?.value?.includes("noreply") ||
      from?.value?.includes("donotreply") ||
      from?.value?.includes("donotreplay") ||
      from?.value?.includes("donotreply") ||
      from?.value?.includes("donotrespond");

    return {
      id: message.id,
      name: fromName,
      email: from?.value,
      to: to?.value,
      subject: subject?.value,
      snippet: message.snippet,
      text: isHtmlEmail ? htmlContent : textContent,
      isHtmlEmail,
      date: date,
      read: readStatus,
      labels: [...message.labelIds],
    } as GMailMessage;
  });
};
