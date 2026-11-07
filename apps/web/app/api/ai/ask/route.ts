import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import prisma from "@/utils/prisma";
import { getOpenAI, AIModel } from "@/utils/openai";
import { DEFAULT_AI_MODEL } from "@/utils/config";
import { withError } from "@/utils/middleware";
import {
  askAiEmailQuerySchema,
  buildAskAiSystemPrompt,
  buildAskAiUserPrompt,
  generateAskAiFallback,
  rankEmailsForQuestion,
  EmailContextItem,
  AskAiEmailResponse,
} from "@/utils/askAiEmails";

export const dynamic = "force-dynamic";

export const POST = withError(async (request: Request) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = askAiEmailQuerySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request query", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { question, limit, threads } = parsed.data;

  // Extract email items from passed threads or fallback empty list
  const emailContextList: EmailContextItem[] = (threads || []).map((t) => ({
    id: t.id,
    sender: t.sender || "",
    email: t.email || "",
    date: t.date || "",
    subject: t.subject || "",
    snippet: t.snippet || "",
    text: t.text || t.snippet || "",
  }));

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      aiModel: true,
      openAIApiKey: true,
    },
  });

  const apiKey = user?.openAIApiKey || process.env.OPENAI_API_KEY;

  // Rank relevant emails for prompt injection
  const ranked = rankEmailsForQuestion(emailContextList, question);
  const topEmails = ranked.slice(0, Math.min(limit || 5, 10)).map((r) => r.email);

  if (!apiKey || topEmails.length === 0) {
    const fallbackResponse = generateAskAiFallback(question, emailContextList);
    return NextResponse.json(fallbackResponse);
  }

  try {
    const openai = getOpenAI(user?.openAIApiKey || null);
    const systemPrompt = buildAskAiSystemPrompt();
    const userPrompt = buildAskAiUserPrompt(question, topEmails);

    const completion = await openai.chat.completions.create({
      model: (user?.aiModel as AIModel) || DEFAULT_AI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 600,
    });

    const answer =
      completion.choices[0]?.message?.content?.trim() ||
      generateAskAiFallback(question, topEmails).answer;

    const sources = topEmails.map((email) => ({
      id: email.id,
      subject: email.subject,
      sender: email.sender || email.email,
      date: email.date,
      relevanceScore: 10,
      snippet: email.snippet,
    }));

    const response: AskAiEmailResponse = {
      answer,
      sources,
      question,
      mode: "llm",
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.warn("OpenAI completion failed, falling back to local analysis:", error);
    const fallbackResponse = generateAskAiFallback(question, emailContextList);
    return NextResponse.json(fallbackResponse);
  }
});
