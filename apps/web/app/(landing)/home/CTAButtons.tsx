"use client";

import { GithubIcon } from "lucide-react";
import { Button } from "@/components/Button";
import { usePostHog } from "posthog-js/react";
import { Tag } from "@/components/Tag";
import TestimonialsAvatars from "../components/testimonials-avatar";

export function CTAButtons() {
  const posthog = usePostHog();

  return (
    <div className="mt-10 grid items-center justify-center gap-x-6 gap-y-2 sm:flex">
      <Button
        color="white"
        className="font-cal"
        size="2xl"
        link={{
          href: "https://magnet.lemonsqueezy.com/checkout/buy/80d89d16-bf1f-4d76-85d4-f7bf9862e20b",
          target: "_blank",
        }}
        onClick={() => {
          posthog.capture("Clicked Pre Order Now");
        }}
      >
        Pre Order Now for 49.99€{" "}
        <span className="ml-2 text-gray-600 line-through">199€</span>
      </Button>
      <div className="mt-6 flex flex-col items-center justify-center font-cal md:mt-0">
        <TestimonialsAvatars priority={true} />
      </div>
      {/* <Button
        size="2xl"
        color="white"
        link={{ href: "/github", target: "_blank" }}
        onClick={() => {
          posthog.capture("Clicked Star on Github", {});
        }}
      >
        <GithubIcon className="mr-2 h-4 w-4" />
        Star us on GitHub
      </Button> */}
    </div>
  );
}
