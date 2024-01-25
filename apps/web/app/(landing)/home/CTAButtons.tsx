"use client";

import { GithubIcon } from "lucide-react";
import { Button } from "@/components/Button";
import { usePostHog } from "posthog-js/react";

export function CTAButtons() {
  const posthog = usePostHog();

  return (
    <div className="mt-10 grid items-center justify-center gap-x-6 gap-y-2 sm:flex">
      <Button
        color="primary"
        size="2xl"
        link={{
          href: "https://magnet.lemonsqueezy.com/checkout/buy/80d89d16-bf1f-4d76-85d4-f7bf9862e20b",
          target: "_blank",
        }}
        onClick={() => {
          posthog.capture("Clicked Get Started");
        }}
      >
        Join the Pre-sale
      </Button>
      <Button
        size="2xl"
        color="white"
        link={{ href: "/github", target: "_blank" }}
        onClick={() => {
          posthog.capture("Clicked Star on Github", {});
        }}
      >
        <GithubIcon className="mr-2 h-4 w-4" />
        Star us on GitHub
      </Button>
    </div>
  );
}
