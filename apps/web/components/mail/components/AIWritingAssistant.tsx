"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  Minimize2,
  CheckCircle2,
  Smile,
  Briefcase,
  Flame,
  HeartHandshake,
  Loader2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { postRequest } from "@/utils/api";
import {
  AIComposeAction,
  AIComposeTone,
  AIComposeResponse,
  generateLocalFallback,
} from "@/utils/aiCompose";
import { toast } from "@/components/ui/use-toast";

interface AIWritingAssistantProps {
  currentText: string;
  onUpdateText: (newText: string) => void;
  disabled?: boolean;
}

export const AIWritingAssistant: React.FC<AIWritingAssistantProps> = ({
  currentText,
  onUpdateText,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [lastOriginalText, setLastOriginalText] = useState<string | null>(null);

  const handleApplyAction = async (action: AIComposeAction, tone?: AIComposeTone) => {
    if (!currentText || currentText.trim().length === 0) {
      toast({
        title: "Draft empty",
        description: "Type some draft text first so the AI assistant can help you.",
      });
      return;
    }

    setLoading(true);
    setLastOriginalText(currentText);

    try {
      const response = await postRequest<AIComposeResponse>(
        "/api/ai/compose",
        {
          text: currentText,
          action,
          tone,
        }
      );

      if ("error" in response || !response?.result) {
        // Fallback locally if network or route error occurs
        const fallbackText = generateLocalFallback({
          text: currentText,
          action,
          tone,
        });
        onUpdateText(fallbackText);
        toast({
          title: "AI Assisted (Local)",
          description: `Applied ${action}${tone ? ` (${tone})` : ""} successfully!`,
        });
      } else {
        onUpdateText(response.result);
        toast({
          title: "AI Writing Assistant",
          description: `Applied ${action}${tone ? ` (${tone})` : ""} successfully!`,
        });
      }
    } catch (err) {
      const fallbackText = generateLocalFallback({
        text: currentText,
        action,
        tone,
      });
      onUpdateText(fallbackText);
      toast({
        title: "AI Assisted (Local)",
        description: `Applied ${action} update to draft.`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = () => {
    if (lastOriginalText !== null) {
      onUpdateText(lastOriginalText);
      setLastOriginalText(null);
      toast({
        title: "Undone",
        description: "Restored previous draft text.",
      });
    }
  };

  const hasDraft = currentText && currentText.trim().length >= 5;

  return (
    <div className="flex items-center space-x-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || loading}
            className="flex items-center gap-1.5 border-dashed border-sky-400/50 bg-sky-50/50 text-xs font-medium text-sky-700 hover:bg-sky-100 hover:text-sky-800 dark:border-sky-500/40 dark:bg-sky-950/30 dark:text-sky-300 dark:hover:bg-sky-900/40"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-sky-500 animate-pulse" />
            )}
            <span>AI Assistant</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-sky-500" />
            AI Writing Assistant
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => handleApplyAction("continue")}
            className="cursor-pointer gap-2"
          >
            <ArrowRight className="h-4 w-4 text-emerald-500" />
            <span>Continue writing</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleApplyAction("shorten")}
            className="cursor-pointer gap-2"
          >
            <Minimize2 className="h-4 w-4 text-amber-500" />
            <span>Shorten / make concise</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleApplyAction("polish")}
            className="cursor-pointer gap-2"
          >
            <CheckCircle2 className="h-4 w-4 text-indigo-500" />
            <span>Rewrite & polish</span>
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer gap-2">
              <Smile className="h-4 w-4 text-violet-500" />
              <span>Change tone</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-44">
              <DropdownMenuItem
                onClick={() => handleApplyAction("change-tone", "professional")}
                className="cursor-pointer gap-2"
              >
                <Briefcase className="h-3.5 w-3.5 text-blue-500" />
                <span>Professional</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleApplyAction("change-tone", "casual")}
                className="cursor-pointer gap-2"
              >
                <Smile className="h-3.5 w-3.5 text-amber-500" />
                <span>Casual</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleApplyAction("change-tone", "friendly")}
                className="cursor-pointer gap-2"
              >
                <HeartHandshake className="h-3.5 w-3.5 text-pink-500" />
                <span>Friendly</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleApplyAction("change-tone", "persuasive")}
                className="cursor-pointer gap-2"
              >
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                <span>Persuasive</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>

      {lastOriginalText !== null && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleUndo}
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          title="Undo AI change"
        >
          <Undo2 className="h-3.5 w-3.5 mr-1" />
          Undo
        </Button>
      )}
    </div>
  );
};
