"use client";

import { useState } from "react";
import { CheckIcon, CreditCardIcon } from "lucide-react";
import { env } from "@/env.mjs";
import { LoadingContent } from "@/components/LoadingContent";
import { usePremium } from "@/components/PremiumAlert";
import { Tag } from "@/components/Tag";
import { Button } from "@/components/Button";

const frequencies = [
  { value: "monthly" as const, label: "Monthly", priceSuffix: "/month" },
  { value: "annually" as const, label: "Annually", priceSuffix: "/year" },
];

const tiers = [
  {
    name: "Free",
    id: "tier-free",
    href: "/welcome",
    price: { monthly: "$0", annually: "$0" },
    description: "Try Caley.io for free.",
    features: [
      `Unsubscribe from ${env.NEXT_PUBLIC_UNSUBSCRIBE_CREDITS} emails per month`,
      "Email analytics",
      "Newsletter management",
      "New senders",
      "Inbox view",
    ],
    cta: "Get Started",
  },
  {
    name: "Pro",
    id: "tier-pro",
    href: env.NEXT_PUBLIC_PRO_PAYMENT_LINK,
    checkout: true,
    price: { monthly: "$10", annually: "$100" },
    description: "Unlock full platform access.",
    features: [
      "Everything in free",
      "Unlimited unsubscribes",
      "AI automations",
      "AI categorization",
      "AI planning mode",
      "Priority support",
    ],
    cta: "Upgrade",
    mostPopular: true,
  },
  {
    name: "Enterprise",
    id: "tier-enterprise",
    href: env.NEXT_PUBLIC_CALL_LINK,
    price: { monthly: "Book a call", annually: "Book a call" },
    description: "For help self-hosting, and dedicated support.",
    features: ["Self-hosted", "Everything in pro", "Dedicated support"],
    hideFrequency: true,
    cta: "Book a call",
  },
];

const LIFETIME_PRICE = 79;
const LIFETIME_LINK = env.NEXT_PUBLIC_LIFETIME_PAYMENT_LINK;

const lifetimeFeatures = [
  "Lifetime access to Caley.io",
  "Unlimited unsubscribes",
  "AI writing",
  "AI automations",
  "Unlimited Analytics",
  "Priority support",
  "Self-hosted",
  "Dedicated support",
];

export function Pricing() {
  const { isPremium, data, isLoading, error } = usePremium();

  const [frequency, setFrequency] = useState(frequencies[0]);

  return (
    <LoadingContent loading={isLoading} error={error}>
      <div
        id="pricing"
        className="relative isolate mx-auto max-w-7xl bg-black px-6 pb-32 pt-10 lg:px-8"
      >
        <div className="mx-auto max-w-2xl text-center lg:max-w-4xl">
          <h2 className="bg-gradient-to-r from-blue-600 to-cyan-400 bg-clip-text font-cal text-base leading-7 text-transparent">
            Pricing
          </h2>
          <p className="mt-2 font-cal text-4xl text-foreground sm:text-5xl">
            Pay once, use forever.
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-foreground/60">
          AI Superpowers, Conversations, Newsletter management, and email
          analytics. Caley.io is the open-source email client that you deserve.
        </p>

        {isPremium && (
          <div className="mt-8 text-center">
            <Button
              link={{
                href: `https://${env.NEXT_PUBLIC_LEMON_STORE_ID}.lemonsqueezy.com/billing`,
                target: "_blank",
              }}
            >
              <CreditCardIcon className="mr-2 h-4 w-4" />
              Manage subscription
            </Button>
          </div>
        )}

        {/* <div className="mt-16 flex justify-center">
          <RadioGroup
            value={frequency}
            onChange={setFrequency}
            className="grid grid-cols-2 gap-x-1 rounded-full p-1 text-center text-xs font-semibold leading-5 ring-1 ring-inset ring-foreground/20"
          >
            <RadioGroup.Label className="sr-only">
              Payment frequency
            </RadioGroup.Label>
            {frequencies.map((option) => (
              <RadioGroup.Option
                key={option.value}
                value={option}
                className={clsx(
                  option.value === frequency.value
                    ? "bg-foreground text-background"
                    : "text-foreground/60",
                  "cursor-pointer rounded-full px-2.5 py-1",
                )}
              >
                <span>{option.label}</span>
              </RadioGroup.Option>
            ))}
          </RadioGroup>
        </div> */}

        {/* <div className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-y-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {tiers.map((tier, tierIdx) => (
            <div className="flex flex-col justify-between" key={tier.id}>
              <div className="relative h-full max-w-sm">
                <div className="absolute inset-0 h-full w-full scale-[0.80] transform rounded-full bg-red-500 bg-gradient-to-r from-blue-500 to-teal-500 blur-3xl" />

                <div className="relative flex h-full flex-col items-start justify-between overflow-hidden rounded-2xl border border-white/10 bg-black px-6 py-8 shadow-xl">
                  <div className="w-full">
                    <div className="flex items-center justify-between gap-x-4">
                      <h1
                        id={tier.id}
                        className={clsx(
                          tier.mostPopular
                            ? "bg-gradient-to-r from-blue-600 to-cyan-400 bg-clip-text font-cal text-transparent"
                            : "text-white",
                          "relative z-50 font-cal text-xl font-bold leading-8",
                        )}
                      >
                        {tier.name}
                      </h1>
                      {tier.mostPopular ? (
                        <div className="rounded-full bg-slate-500/20 px-2.5 py-1 font-cal text-xs leading-5 text-blue-600">
                          <p className="bg-gradient-to-r from-blue-600 to-cyan-400 bg-clip-text font-cal text-transparent">
                            Most popular
                          </p>
                        </div>
                      ) : null}
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-500">
                      {tier.description}
                    </p>
                    <p className="mt-6 flex items-baseline gap-x-1">
                      <span className="text-4xl font-bold tracking-tight text-white">
                        {tier.price[frequency.value]}
                      </span>
                      {!tier.hideFrequency && (
                        <span className="text-sm font-semibold leading-6 text-gray-600">
                          {frequency.priceSuffix}
                        </span>
                      )}
                    </p>
                    <ul
                      role="list"
                      className="mt-8 space-y-3 text-sm leading-6 text-slate-500"
                    >
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex gap-x-3">
                          <CheckIcon
                            className="h-6 w-5 flex-none text-blue-600"
                            aria-hidden="true"
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <a
                    href="/#hero"
                    aria-describedby={tier.id}
                    className={clsx(
                      tier.mostPopular
                        ? "bg-gradient-to-r from-blue-600 to-cyan-400 text-white shadow-sm hover:bg-gradient-to-r hover:from-blue-500/40 hover:to-teal-500/40"
                        : "text-white/60 ring-1 ring-inset ring-white/60 hover:ring-white/20",
                      "mt-8 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
                    )}
                  >
                    Join the waitlist
                  </a>

                  
                  {tier.mostPopular && <Meteors number={20} />}
                </div>
              </div>
            </div>
          ))}
        </div> */}

        <LifetimePricing />
      </div>
    </LoadingContent>
  );
}

function LifetimePricing() {
  return (
    <div className="mt-12 flex flex-col justify-between pr-6">
      <div className="relative h-full w-full">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 px-6 py-8 shadow-xl">
          <div className="flex w-full">
            <div className="p-8 sm:p-10 lg:flex-auto">
              <h3 className="flex items-center font-cal text-2xl text-white">
                Lifetime access
                <div className="ml-4">
                  <Tag color="green">Limited Time Offer</Tag>
                </div>
              </h3>
              <p className="mt-4 text-base leading-7 text-slate-500">
                Get lifetime access to Caley.io for a one-time payment.
              </p>
              <div className="mt-10 flex items-center gap-x-4">
                <h4 className="flex-none bg-gradient-to-r from-blue-600 to-cyan-400 bg-clip-text font-cal text-sm leading-6 text-transparent">
                  What’s included
                </h4>
                <div className="h-px flex-auto items-center justify-center bg-slate-500" />
              </div>
              <ul
                role="list"
                className="mt-8 grid grid-cols-1 gap-4 text-sm leading-6 text-slate-500 sm:grid-cols-2 sm:gap-6"
              >
                {lifetimeFeatures.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <CheckIcon
                      className="h-6 w-5 flex-none text-blue-600"
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative -mt-2 flex items-center justify-center p-2 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0">
              <div className="absolute inset-0 h-full w-full scale-[0.80] transform rounded-full bg-red-500 bg-gradient-to-r from-blue-500 to-teal-500 blur-3xl" />

              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black px-6 py-8 text-center shadow-xl ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-16">
                <div className="mx-auto max-w-xs px-8">
                  <p className="text-base font-semibold text-white">
                    Lifetime access to Caley.io
                  </p>
                  <p className="mt-6 flex items-baseline justify-center gap-x-2">
                    <span className="text-5xl font-bold tracking-tight text-white">
                      {LIFETIME_PRICE}€
                    </span>
                    <span className="text-sm font-semibold leading-6 tracking-wide text-gray-600 line-through">
                      199€
                    </span>
                  </p>
                  <a
                    href="https://buy.stripe.com/9AQ2aafKJgVL3pCcMT"
                    target="_blank"
                    className="mt-10 block w-full rounded-md bg-gradient-to-r from-blue-600 to-cyan-400 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Join the Pre-sale
                  </a>
                </div>
                {/* <Meteors number={20} /> */}
              </div>
            </div>

            {/* Meaty part - Meteor effect */}
          </div>
        </div>
      </div>
    </div>
  );
}

function OldLifetime() {
  return (
    <div className="bg-background py-4 sm:py-8">
      <div className="relative mx-auto max-w-2xl rounded-3xl bg-white ring-1 ring-gray-200 lg:mx-0 lg:flex lg:max-w-none">
        <div className="absolute inset-0 h-full w-full scale-[0.90] transform rounded-full bg-red-500 bg-gradient-to-r from-blue-500 to-teal-500 blur-3xl" />

        <div className="p-8 sm:p-10 lg:flex-auto">
          <h3 className="flex items-center font-cal text-2xl text-gray-900">
            Lifetime access
            <div className="ml-4">
              <Tag color="green">Limited Time Offer</Tag>
            </div>
          </h3>
          <p className="mt-6 text-base leading-7 text-gray-600">
            Get lifetime access to Caley.io Pro for a one-time payment. This
            includes $100 in AI credits.
          </p>
          <div className="mt-10 flex items-center gap-x-4">
            <h4 className="flex-none font-cal text-sm leading-6 text-blue-600">
              What’s included
            </h4>
            <div className="h-px flex-auto bg-gray-100" />
          </div>
          <ul
            role="list"
            className="mt-8 grid grid-cols-1 gap-4 text-sm leading-6 text-gray-600 sm:grid-cols-2 sm:gap-6"
          >
            {lifetimeFeatures.map((feature) => (
              <li key={feature} className="flex gap-x-3">
                <CheckIcon
                  className="h-6 w-5 flex-none text-blue-600"
                  aria-hidden="true"
                />
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <div className="-mt-2 p-2 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0">
          <div className="relative rounded-2xl bg-gray-50 py-10 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-16">
            <div className="absolute inset-0 h-full w-full scale-[0.80] transform rounded-full bg-red-500 bg-gradient-to-r from-blue-500 to-teal-500 blur-3xl" />
            <div className="mx-auto max-w-xs px-8">
              <p className="text-base font-semibold text-gray-600">
                Lifetime access to Caley.io
              </p>
              <p className="mt-6 flex items-baseline justify-center gap-x-2">
                <span className="text-5xl font-bold tracking-tight text-gray-900">
                  ${LIFETIME_PRICE}
                </span>
                <span className="text-sm font-semibold leading-6 tracking-wide text-gray-600">
                  USD
                </span>
              </p>
              <a
                href={LIFETIME_LINK}
                target="_blank"
                className="mt-10 block w-full rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Get lifetime access
              </a>
              <p className="mt-6 text-xs leading-5 text-gray-600">
                Invoices and receipts available for easy company reimbursement
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
