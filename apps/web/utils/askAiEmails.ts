import { z } from "zod";

export interface EmailContextItem {
  id: string;
  sender: string;
  email: string;
  date: string;
  subject: string;
  snippet: string;
  text?: string;
}

export const askAiEmailQuerySchema = z.object({
  question: z.string().min(1, "Question cannot be empty"),
  limit: z.number().optional().default(10),
  threads: z
    .array(
      z.object({
        id: z.string(),
        sender: z.string().optional().default(""),
        email: z.string().optional().default(""),
        date: z.string().optional().default(""),
        subject: z.string().optional().default(""),
        snippet: z.string().optional().default(""),
        text: z.string().optional().default(""),
      }),
    )
    .optional(),
});

export type AskAiEmailQuery = z.infer<typeof askAiEmailQuerySchema>;

export interface RelevantEmailSource {
  id: string;
  subject: string;
  sender: string;
  date: string;
  relevanceScore: number;
  snippet: string;
}

export interface AskAiEmailResponse {
  answer: string;
  sources: RelevantEmailSource[];
  question: string;
  mode: "llm" | "fallback";
}

/**
 * Filter and rank emails based on question tokens and semantics.
 */
export function rankEmailsForQuestion(
  emails: EmailContextItem[],
  question: string,
): { email: EmailContextItem; score: number }[] {
  const normalizedQuestion = question.toLowerCase();
  const rawTerms = normalizedQuestion
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length >= 2);

  const stopWords = new Set([
    "what", "when", "where", "which", "who", "whom", "whose", "why", "how",
    "the", "and", "about", "for", "with", "from", "that", "this", "have", "had",
    "did", "was", "were", "last", "email", "sent", "send", "tell", "show", "can",
    "you", "our", "are", "been", "has", "agreement", "talk", "talked", "client",
  ]);

  const searchKeywords = rawTerms.filter((term) => !stopWords.has(term));
  const scored = emails.map((item) => {
    let score = 0;
    const sender = (item.sender || "").toLowerCase();
    const emailAddr = (item.email || "").toLowerCase();
    const subject = (item.subject || "").toLowerCase();
    const snippet = (item.snippet || "").toLowerCase();
    const text = (item.text || "").toLowerCase();

    // Check raw terms against sender
    for (const term of rawTerms) {
      if (sender.includes(term) || emailAddr.includes(term)) {
        score += 8;
      }
      if (subject.includes(term)) {
        score += 5;
      }
      if (snippet.includes(term) || text.includes(term)) {
        score += 2;
      }
    }

    // Specific phrase matches
    for (const keyword of searchKeywords) {
      if (sender.includes(keyword)) score += 10;
      if (subject.includes(keyword)) score += 6;
      if (snippet.includes(keyword) || text.includes(keyword)) score += 3;
    }

    // Recency bonus (if date parsed)
    if (item.date) {
      const timeDiff = Date.now() - new Date(item.date).getTime();
      if (!isNaN(timeDiff) && timeDiff > 0) {
        const daysOld = timeDiff / (1000 * 60 * 60 * 24);
        if (daysOld < 7) score += 2;
        else if (daysOld < 30) score += 1;
      }
    }

    return { email: item, score };
  });

  // Sort descending by score
  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Builds system prompt instructing the LLM to act as an email intelligence assistant.
 */
export function buildAskAiSystemPrompt(): string {
  return `You are an AI Email Assistant for Inbox Zero.
Your objective is to answer user questions about their emails accurately, concisely, and helpfully based ONLY on the provided email context.
Rules:
1. Always cite relevant emails by sender, subject, and date.
2. If the answer cannot be found from the provided emails, politely state that you could not find the information in their recent emails.
3. Be direct, professional, and clear without unnecessary filler phrases.`;
}

/**
 * Builds user prompt containing the matched email context and the question.
 */
export function buildAskAiUserPrompt(
  question: string,
  topEmails: EmailContextItem[],
): string {
  let contextBlock = "Relevant Emails Found:\n";

  if (topEmails.length === 0) {
    contextBlock += "No matching emails found.\n";
  } else {
    topEmails.forEach((email, index) => {
      contextBlock += `\n[Email ${index + 1}]\n`;
      contextBlock += `Sender: ${email.sender || "Unknown"} <${email.email || ""}>\n`;
      contextBlock += `Date: ${email.date || "Unknown"}\n`;
      contextBlock += `Subject: ${email.subject || "No Subject"}\n`;
      contextBlock += `Content: ${email.text || email.snippet || "No Content"}\n`;
      contextBlock += `------------------------------\n`;
    });
  }

  return `${contextBlock}\nUser Question: "${question}"\n\nPlease answer the question based on the above emails:`;
}

/**
 * Deterministic search and summarization fallback when OpenAI / external LLM is offline or not configured.
 */
export function generateAskAiFallback(
  question: string,
  emails: EmailContextItem[],
): AskAiEmailResponse {
  if (emails.length === 0) {
    return {
      answer: "No emails are currently available in your mailbox to answer this question.",
      sources: [],
      question,
      mode: "fallback",
    };
  }

  const ranked = rankEmailsForQuestion(emails, question);
  const matched = ranked.filter((r) => r.score > 0);
  const topCandidates = (matched.length > 0 ? matched : ranked).slice(0, 3);

  const sources: RelevantEmailSource[] = topCandidates.map(({ email, score }) => ({
    id: email.id,
    subject: email.subject || "No Subject",
    sender: email.sender || email.email || "Unknown",
    date: email.date || "",
    relevanceScore: score,
    snippet: email.snippet || (email.text ? email.text.slice(0, 160) : ""),
  }));

  const top = topCandidates[0]?.email;

  let answer = "";
  if (!top || (matched.length === 0 && !question.toLowerCase().includes("all") && !question.toLowerCase().includes("recent"))) {
    answer = `I searched through ${emails.length} emails, but couldn't find a direct match for "${question}". Try querying by sender name, subject, or specific keywords.`;
  } else {
    const senderName = top.sender || top.email || "the sender";
    const subject = top.subject ? `"${top.subject}"` : "their email";
    const content = top.snippet || top.text || "the discussed topics";

    const qLower = question.toLowerCase();
    if (qLower.includes("talk") || qLower.includes("what") || qLower.includes("last email")) {
      answer = `Based on the latest email from ${senderName} regarding ${subject}: they discussed: "${content}".`;
    } else if (qLower.includes("agreement") || qLower.includes("contract") || qLower.includes("client")) {
      answer = `In ${subject} from ${senderName} (${top.date || "recently"}): the correspondence indicates: "${content}".`;
    } else {
      answer = `Regarding your question about "${question}", the most relevant message from ${senderName} with subject ${subject} mentions: "${content}".`;
    }
  }

  return {
    answer,
    sources,
    question,
    mode: "fallback",
  };
}
