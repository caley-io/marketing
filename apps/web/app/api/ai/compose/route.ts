import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import prisma from "@/utils/prisma";
import { getOpenAI, AIModel } from "@/utils/openai";
import { DEFAULT_AI_MODEL } from "@/utils/config";
import { withError } from "@/utils/middleware";
import {
  aiComposeRequestSchema,
  buildSystemPrompt,
  buildUserPrompt,
  generateLocalFallback,
  AIComposeResponse,
} from "@/utils/aiCompose";

export const POST = withError(async (request: Request) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = aiComposeRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { text, action, tone, customInstructions } = parsed.data;

  // Retrieve user custom OpenAI settings if configured
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      aiModel: true,
      openAIApiKey: true,
    },
  });

  const apiKey = user?.openAIApiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Graceful fallback when no OpenAI key is set in current environment
    const fallbackResult = generateLocalFallback(parsed.data);
    const response: AIComposeResponse = {
      result: fallbackResult,
      action,
      tone,
      replaced: action !== "continue",
    };
    return NextResponse.json(response);
  }

  try {
    const openai = getOpenAI(user?.openAIApiKey || null);
    const systemPrompt = buildSystemPrompt(action, tone);
    const userPrompt = buildUserPrompt(parsed.data);

    const completion = await openai.chat.completions.create({
      model: (user?.aiModel as AIModel) || DEFAULT_AI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const result =
      completion.choices[0]?.message?.content?.trim() ||
      generateLocalFallback(parsed.data);

    const response: AIComposeResponse = {
      result,
      action,
      tone,
      replaced: action !== "continue",
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.warn("AI compose completion failed, falling back to local transform:", error);
    const fallbackResult = generateLocalFallback(parsed.data);
    const response: AIComposeResponse = {
      result: fallbackResult,
      action,
      tone,
      replaced: action !== "continue",
    };
    return NextResponse.json(response);
  }
});
