/**
 * HTML Email sanitization, transformation, and responsive styling utility.
 */

export interface EmailHtmlOptions {
  isDarkMode?: boolean;
  defaultFont?: string;
  enableResponsiveImages?: boolean;
}

/**
 * Prepares and sanitizes HTML email content for iframe rendering:
 * 1. Ensures all links open in a new window/tab safely (target="_blank", rel="noopener noreferrer").
 * 2. Injects responsive CSS and dark-mode adaptation.
 * 3. Injects seamless postMessage height reporting with ResizeObserver.
 */
export function prepareEmailHtml(
  rawHtml: string,
  options: EmailHtmlOptions = {},
): string {
  if (!rawHtml || typeof rawHtml !== "string") {
    return "<p></p>";
  }

  let html = rawHtml;

  // 1. Sanitize dangerous tags: script, embed, object, applet, base
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  html = html.replace(/<embed\b[^>]*>/gi, "");
  html = html.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "");
  html = html.replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, "");
  html = html.replace(/<base\b[^>]*>/gi, "");

  // 2. Ensure all anchors open in a new tab safely
  html = html.replace(/<a\b([^>]*)>/gi, (match, p1) => {
    let attrs = p1;
    // Remove existing target and rel to avoid duplicates
    attrs = attrs.replace(/\btarget\s*=\s*(['"]).*?\1/gi, "");
    attrs = attrs.replace(/\brel\s*=\s*(['"]).*?\1/gi, "");
    return `<a target="_blank" rel="noopener noreferrer" ${attrs}>`;
  });

  // 3. Prepare client-side injected stylesheet and script
  const isDark = options.isDarkMode ?? false;
  const baseBg = isDark ? "#09090b" : "#ffffff";
  const baseColor = isDark ? "#f4f4f5" : "#18181b";

  const injectedStyles = `
    <style id="caley-email-viewer-styles">
      :root {
        color-scheme: ${isDark ? "dark" : "light"};
      }
      html, body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: ${baseColor};
        background-color: transparent;
        overflow-x: hidden;
        word-break: break-word;
      }
      img {
        max-width: 100% !important;
        height: auto !important;
      }
      table {
        max-width: 100% !important;
      }
      a {
        color: #0284c7;
      }
    </style>
  `;

  const resizeScript = `
    <script>
      (function() {
        function notifyHeight() {
          try {
            var body = document.body;
            var html = document.documentElement;
            var height = Math.max(
              body ? body.scrollHeight : 0,
              body ? body.offsetHeight : 0,
              html ? html.clientHeight : 0,
              html ? html.scrollHeight : 0,
              html ? html.offsetHeight : 0
            );
            if (height > 0) {
              window.parent.postMessage({ type: 'CALEY_EMAIL_RESIZE', height: height }, '*');
            }
          } catch(e) {}
        }

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', notifyHeight);
        } else {
          notifyHeight();
        }

        window.addEventListener('load', notifyHeight);

        if (window.ResizeObserver && document.body) {
          var ro = new ResizeObserver(function() {
            notifyHeight();
          });
          ro.observe(document.body);
        }

        // Fallback polling for asynchronous image loading
        setTimeout(notifyHeight, 200);
        setTimeout(notifyHeight, 600);
        setTimeout(notifyHeight, 1500);
      })();
    </script>
  `;

  // Inject into <head> or prepend
  if (/<head\b[^>]*>/i.test(html)) {
    html = html.replace(/<head\b[^>]*>/i, `$&${injectedStyles}`);
  } else {
    html = `${injectedStyles}${html}`;
  }

  // Inject resizeScript before </body> or append
  if (/<\/body>/i.test(html)) {
    html = html.replace(/<\/body>/i, `${resizeScript}</body>`);
  } else {
    html = `${html}${resizeScript}`;
  }

  return html;
}

/**
 * Extracts plain text from an HTML email string for conversational display fallback.
 */
export function extractPlainTextFromHtml(html: string): string {
  if (!html) return "";

  // Replace br and p with newlines
  let text = html.replace(/<br\s*[\/]?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<\/div>/gi, "\n");
  text = text.replace(/<\/tr>/gi, "\n");
  text = text.replace(/<\/li>/gi, "\n");

  // Strip all remaining HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Normalize excessive whitespaces and empty lines
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line, i, arr) => line !== "" || (i > 0 && arr[i - 1] !== ""))
    .join("\n")
    .trim();
}

/**
 * Heuristic to detect whether an email is a marketing newsletter / rich HTML email
 * versus a standard conversational reply.
 */
export function isComplexHtmlEmail(html: string): boolean {
  if (!html) return false;
  const lower = html.toLowerCase();

  // Newsletters and marketing emails typically contain tables, doctypes, head/body structures, or unsubscribe links
  const hasDoctype = lower.includes("<!doctype html");
  const hasTables = (lower.match(/<table\b/g) || []).length >= 2;
  const hasUnsubscribe = lower.includes("unsubscribe") || lower.includes("view in browser");
  const hasHtmlTag = lower.includes("<html") && lower.includes("<body");

  return hasDoctype || hasTables || (hasUnsubscribe && lower.includes("<div")) || hasHtmlTag;
}
