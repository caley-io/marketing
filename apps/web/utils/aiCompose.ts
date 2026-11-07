import { z } from "zod";

export const aiComposeActionSchema = z.enum([
  "continue",
  "shorten",
  "polish",
  "change-tone",
]);

export type AIComposeAction = z.infer<typeof aiComposeActionSchema>;

export const aiComposeToneSchema = z.enum([
  "professional",
  "casual",
  "persuasive",
  "friendly",
]);

export type AIComposeTone = z.infer<typeof aiComposeToneSchema>;

export const aiComposeRequestSchema = z.object({
  text: z.string().min(1, "Draft text is required"),
  action: aiComposeActionSchema,
  tone: aiComposeToneSchema.optional(),
  customInstructions: z.string().optional(),
});

export type AIComposeRequest = z.infer<typeof aiComposeRequestSchema>;

export interface AIComposeResponse {
  result: string;
  action: AIComposeAction;
  tone?: AIComposeTone;
  replaced: boolean;
}

export function buildSystemPrompt(action: AIComposeAction, tone?: AIComposeTone): string {
  const baseInstruction =
    "You are an expert email writing assistant for Inbox Zero. Your objective is to help the user craft clear, effective, and compelling email messages. Return ONLY the refined email text without greetings/explanations like 'Here is your text:', without wrapping quotes, and preserving the context.";

  switch (action) {
    case "continue":
      return `${baseInstruction} Continue writing the user's email naturally, expanding on their thoughts with 1-2 thoughtful, cohesive paragraphs. Match the existing context and intent.`;
    case "shorten":
      return `${baseInstruction} Condense and shorten the user's email to make it crisp, concise, and direct. Remove fluff while retaining all critical details and action items.`;
    case "polish":
      return `${baseInstruction} Polish and rewrite the user's email for maximum clarity, flawless grammar, and punchy flow while retaining the exact original meaning.`;
    case "change-tone":
      return `${baseInstruction} Adjust the tone of the user's email to be distinctly ${tone || "professional"}. Keep the core message intact while styling the vocabulary and sentence structure to suit the requested tone.`;
    default:
      return baseInstruction;
  }
}

export function buildUserPrompt(request: AIComposeRequest): string {
  const { text, action, tone, customInstructions } = request;
  let prompt = `Current email draft:\n"""\n${text}\n"""\n\n`;

  if (action === "change-tone" && tone) {
    prompt += `Action: Rewrite this email in a ${tone} tone.\n`;
  } else if (action === "continue") {
    prompt += `Action: Continue writing this email from where it left off.\n`;
  } else if (action === "shorten") {
    prompt += `Action: Make this email more concise and to the point.\n`;
  } else if (action === "polish") {
    prompt += `Action: Polish this email for clarity, readability, and correct grammar.\n`;
  }

  if (customInstructions) {
    prompt += `Additional guidance: ${customInstructions}\n`;
  }

  prompt += `\nPlease output only the resulting email text:`;
  return prompt;
}

/**
 * Deterministic fallback generator for development, testing, and offline modes
 * when OpenAI API key is not supplied or during local unit tests.
 */
export function generateLocalFallback(request: AIComposeRequest): string {
  const trimmed = request.text.trim();

  switch (request.action) {
    case "continue": {
      const continuation =
        "\n\nPlease let me know your thoughts on this when you have a moment, and feel free to reach out if you have any questions or need further clarification. Looking forward to our next steps.";
      return `${trimmed}${continuation}`;
    }

    case "shorten": {
      // Split into sentences and keep core points, eliminating filler phrases
      const cleaned = trimmed
        .replace(/I just wanted to reach out and let you know that/gi, "Please note that")
        .replace(/I am writing to you because/gi, "")
        .replace(/at your earliest convenience/gi, "soon")
        .replace(/in order to/gi, "to")
        .replace(/due to the fact that/gi, "because")
        .replace(/as soon as possible/gi, "ASAP")
        .replace(/\s+/g, " ")
        .trim();

      const sentences = cleaned.split(/(?<=[.?!])\s+/).filter(Boolean);
      if (sentences.length <= 2) {
        return cleaned;
      }
      // Return first 2 concise sentences or condensed bullet points
      return sentences.slice(0, Math.ceil(sentences.length / 2)).join(" ");
    }

    case "polish": {
      // Capitalize sentences and clean up double spaces, punctuation
      let polished = trimmed
        .replace(/\s+/g, " ")
        .replace(/([.?!]\s*)([a-z])/g, (_, p1, p2) => `${p1}${p2.toUpperCase()}`);

      if (polished.length > 0) {
        polished = polished.charAt(0).toUpperCase() + polished.slice(1);
      }
      if (!/[.!?]$/.test(polished)) {
        polished += ".";
      }
      return polished;
    }

    case "change-tone": {
      const tone = request.tone || "professional";
      switch (tone) {
        case "casual":
          return trimmed
            .replace(/Dear Sir\/Madam,/gi, "Hey there,")
            .replace(/Sincerely,|Best regards,|Regards,/gi, "Cheers,")
            .replace(/I would like to inquire about/gi, "Quick question about")
            .replace(/Thank you for your prompt response/gi, "Thanks for getting back so fast");
        case "friendly":
          return `Hope you're having a wonderful day! ${trimmed} Have a great rest of your week!`;
        case "persuasive":
          return `${trimmed}\n\nPartnering together will allow us to achieve measurable impact right away. Let's make this happen!`;
        case "professional":
        default:
          return trimmed
            .replace(/hey(?:\s+there)?/gi, "Hello")
            .replace(/cheers/gi, "Best regards")
            .replace(/thanks a bunch/gi, "Thank you very much");
      }
    }
  }
}
