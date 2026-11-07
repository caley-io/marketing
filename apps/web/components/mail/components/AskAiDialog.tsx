"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Search,
  Loader2,
  Mail,
  User,
  Calendar,
  Send,
  HelpCircle,
  Lightbulb,
} from "lucide-react";
import { useAtom, useAtomValue } from "jotai";
import { openAskAiAtom, threadsAtom } from "@/utils/store";
import { postRequest } from "@/utils/api";
import {
  AskAiEmailResponse,
  EmailContextItem,
  generateAskAiFallback,
} from "@/utils/askAiEmails";
import { GMailThread } from "@/utils/gmail/types";

export const AskAiDialog = () => {
  const [open, setOpen] = useAtom(openAskAiAtom);
  const threadsData = useAtomValue(threadsAtom);

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AskAiEmailResponse | null>(null);

  // Extract email list from threads stored in atom
  const getContextEmails = (): EmailContextItem[] => {
    if (!threadsData?.threads || !Array.isArray(threadsData.threads)) {
      return [];
    }

    return threadsData.threads.slice(0, 40).map((thread: GMailThread) => {
      const firstMsg = thread.messages?.[0];
      return {
        id: thread.id,
        sender: firstMsg?.name || "",
        email: firstMsg?.email || "",
        date: firstMsg?.date || "",
        subject: firstMsg?.subject || "",
        snippet: thread.snippet || firstMsg?.snippet || "",
        text: firstMsg?.text || thread.snippet || "",
      };
    });
  };

  const handleAsk = async (queryText?: string) => {
    const activeQuestion = (queryText || question).trim();
    if (!activeQuestion) return;

    setLoading(true);
    setResponse(null);

    const contextEmails = getContextEmails();

    try {
      const res = await postRequest<AskAiEmailResponse>("/api/ai/ask", {
        question: activeQuestion,
        limit: 5,
        threads: contextEmails,
      });

      if ("error" in res || !res?.answer) {
        // Local fallback
        const fallback = generateAskAiFallback(activeQuestion, contextEmails);
        setResponse(fallback);
      } else {
        setResponse(res);
      }
    } catch (err) {
      const fallback = generateAskAiFallback(activeQuestion, contextEmails);
      setResponse(fallback);
    } finally {
      setLoading(false);
    }
  };

  const sampleQueries = [
    "What did John talk about in the last email he sent me?",
    "What was the agreement we had with client X?",
    "Any urgent deadlines or meetings mentioned this week?",
    "Show me invoices or receipts from recent emails",
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Sparkles className="h-5 w-5 text-sky-500 animate-pulse" />
            Ask AI About Your Emails
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Query your inbox with natural language using AI intelligence.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {/* Question Input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ask anything about your emails... (e.g. agreements, status, dates)"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="pl-9 pr-4 py-2 h-10 text-sm"
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading || !question.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="ml-1.5 hidden sm:inline">Ask</span>
            </Button>
          </form>

          {/* Quick Suggestions when no answer yet */}
          {!response && !loading && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                Example Questions:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sampleQueries.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuestion(sample);
                      handleAsk(sample);
                    }}
                    className="p-2.5 text-left text-xs rounded-md border bg-muted/40 hover:bg-muted/80 text-foreground transition-colors"
                  >
                    &ldquo;{sample}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="flex flex-col items-center justify-center p-8 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
              <p className="text-xs text-muted-foreground animate-pulse">
                Analyzing inbox threads and generating answer...
              </p>
            </div>
          )}

          {/* AI Response Card */}
          {response && !loading && (
            <div className="space-y-4 pt-1">
              <div className="p-4 rounded-lg bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-sky-800 dark:text-sky-300">
                  <Sparkles className="h-4 w-4 text-sky-500" />
                  Answer
                </div>
                <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {response.answer}
                </div>
              </div>

              {/* Cited Sources */}
              {response.sources && response.sources.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    Referenced Messages ({response.sources.length}):
                  </div>
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {response.sources.map((src, index) => (
                      <div
                        key={index}
                        className="p-3 text-xs rounded-md border bg-background/50 hover:bg-muted/30 transition-colors space-y-1"
                      >
                        <div className="font-semibold text-foreground flex items-center justify-between">
                          <span className="truncate">{src.subject || "No Subject"}</span>
                          {src.date && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(src.date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="text-muted-foreground text-[11px] flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {src.sender}
                        </div>
                        {src.snippet && (
                          <div className="text-muted-foreground line-clamp-2 text-[11px] pt-1 italic">
                            &ldquo;{src.snippet}&rdquo;
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
