import { Metadata } from "next";
import { Suspense } from "react";
import { PostHogPageview, PostHogProvider } from "@/providers/PostHogProvider";
import "../styles/globals.css";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { env } from "@/env.mjs";
import { LemonScript } from "@/utils/scripts/lemon";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  preload: true,
  display: "swap",
});
const calFont = localFont({
  src: "../styles/CalSans-SemiBold.woff2",
  variable: "--font-cal",
  preload: true,
  display: "swap",
});

const title = "Caley.io";
const description = "Email, but smart and beautiful.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    images: ["/images/opengraph-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    creator: "@geekpreneur_",
    images: ["/images/opengraph-image.png"],
  },
  metadataBase: new URL(env.NEXT_PUBLIC_BASE_URL),
};

export const viewport = {
  themeColor: "#FFF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`h-full ${inter.variable} ${calFont.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <PostHogProvider>
            <Suspense>
              <PostHogPageview />
            </Suspense>
            {children}
            <Analytics />
          </PostHogProvider>
        </ThemeProvider>
      </body>
      <LemonScript />
    </html>
  );
}
