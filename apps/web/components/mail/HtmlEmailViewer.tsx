"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Maximize2,
  Minimize2,
  Code2,
  FileText,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  prepareEmailHtml,
  extractPlainTextFromHtml,
  isComplexHtmlEmail,
} from "@/utils/htmlSanitizer";
import { useTheme } from "next-themes";

interface HtmlEmailViewerProps {
  htmlContent: string;
  messageId: string;
  defaultMode?: "html" | "text";
  className?: string;
}

export function HtmlEmailViewer({
  htmlContent,
  messageId,
  defaultMode,
  className = "",
}: HtmlEmailViewerProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const isComplex = isComplexHtmlEmail(htmlContent);
  const [viewMode, setViewMode] = useState<"html" | "text">(
    defaultMode || "html",
  );
  const [iframeHeight, setIframeHeight] = useState<number>(200);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const preparedHtml = React.useMemo(() => {
    return prepareEmailHtml(htmlContent, {
      isDarkMode: isDark,
    });
  }, [htmlContent, isDark]);

  const plainText = React.useMemo(() => {
    return extractPlainTextFromHtml(htmlContent);
  }, [htmlContent]);

  // Synchronize height via postMessage event
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "CALEY_EMAIL_RESIZE" && typeof e.data.height === "number") {
        if (e.data.height > 50) {
          setIframeHeight(e.data.height + 20); // add padding cushion
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Direct contentDocument measurement on iframe load & resize
  const measureIframeHeight = () => {
    try {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentDocument) return;

      const body = iframe.contentDocument.body;
      const html = iframe.contentDocument.documentElement;
      if (!body || !html) return;

      const measured = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight,
      );

      if (measured > 50) {
        setIframeHeight(measured + 20);
      }
    } catch (err) {
      // Cross-origin fallback
    }
  };

  const handleOpenInNewWindow = () => {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(preparedHtml);
      win.document.close();
    }
  };

  return (
    <div
      className={`rounded-lg border bg-card transition-all overflow-hidden ${
        isFullscreen
          ? "fixed inset-4 z-50 shadow-2xl flex flex-col bg-background/98 backdrop-blur"
          : "w-full my-2"
      } ${className}`}
    >
      {/* Viewer Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/30 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={viewMode === "html" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("html")}
            className="h-6 px-2 text-[11px] flex items-center gap-1 font-medium"
          >
            <Code2 className="h-3 w-3" />
            <span>Rich HTML</span>
          </Button>

          <Button
            type="button"
            variant={viewMode === "text" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("text")}
            className="h-6 px-2 text-[11px] flex items-center gap-1 font-medium"
          >
            <FileText className="h-3 w-3" />
            <span>Clean Text</span>
          </Button>

          {isComplex && (
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-medium ml-1">
              Newsletter / Digest
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={measureIframeHeight}
            title="Recalculate dimensions"
            className="h-6 w-6"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleOpenInNewWindow}
            title="Open HTML in new window"
            className="h-6 w-6"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            className="h-6 w-6"
          >
            {isFullscreen ? (
              <Minimize2 className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className={isFullscreen ? "flex-1 overflow-auto p-4" : "w-full"}>
        {viewMode === "html" ? (
          <iframe
            ref={iframeRef}
            key={`${messageId}-${resolvedTheme}`}
            title={`Email Message ${messageId}`}
            srcDoc={preparedHtml}
            onLoad={measureIframeHeight}
            className="w-full border-none transition-all block"
            sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            style={{
              width: "100%",
              height: isFullscreen ? "100%" : `${iframeHeight}px`,
              minHeight: "120px",
              border: "none",
            }}
          />
        ) : (
          <div className="p-4 text-xs font-mono whitespace-pre-wrap leading-relaxed max-w-4xl text-foreground selection:bg-primary/20">
            {plainText || (
              <span className="text-muted-foreground italic">
                No plain text representation available for this message.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
