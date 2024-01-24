const faqs = [
  {
    question: "How does Caley.io handle my email data?",
    answer:
      "Your privacy is paramount. We store only a secure hash of your emails to power our analytics features. Our commitment to transparency is clear—you can review our open-source code anytime. For those who prioritize complete data control, we offer the flexibility to self-host Caley.io.",
  },
  {
    question: "Is Caley.io’s codebase accessible to the public?",
    answer: (
      <>
        Absolutely! Dive into our development process and contribute to our
        community on our{" "}
        <a
          href="/github"
          target="_blank"
          className="font-semibold hover:underline"
        >
          GitHub repo
        </a>
        .
      </>
    ),
  },
  {
    question: "Can I suggest new features for Caley.io?",
    answer: (
      <>
        We thrive on user feedback! Share your suggestions via a{" "}
        <a
          href="/github"
          target="_blank"
          className="font-semibold hover:underline"
        >
          GitHub
        </a>{" "}
        issue or drop us an{" "}
        <a
          href="mailto:jeremy@caley.io"
          target="_blank"
          className="font-semibold hover:underline"
        >
          email
        </a>{" "}
        . Enhancing your email experience is our core mission.
      </>
    ),
  },
  {
    question: "Which email services are compatible with Caley.io?",
    answer:
      "Currently, Caley.io seamlessly integrates with Gmail and G Suite accounts. We're exploring the horizon for adding compatibility with other providers, like Outlook, to broaden your choices.",
  },
  {
    question: "What’s your refund policy?",
    answer: (
      <>
        We aim for your utmost satisfaction. If you feel Caley.io hasn{"'"}t
        enriched your email interaction, reach out via{" "}
        <a
          href="mailto:jeremy@caley.io"
          target="_blank"
          className="font-semibold hover:underline"
        >
          email
        </a>{" "}
        within the first 14 days of your upgrade. We{"'"}ll arrange a
        hassle-free refund.
      </>
    ),
  },
];

export function FAQs() {
  return (
    <div
      className="mx-auto max-w-2xl divide-y divide-foreground/10 px-6 pb-8 sm:pb-24 sm:pt-12 lg:max-w-7xl lg:px-8 lg:pb-32"
      id="faq"
    >
      <h2 className="font-cal text-2xl leading-10 text-foreground">
        Frequently asked questions
      </h2>
      <dl className="mt-10 space-y-8 divide-y divide-foreground/10">
        {faqs.map((faq) => (
          <div
            key={faq.question}
            className="pt-8 lg:grid lg:grid-cols-12 lg:gap-8"
          >
            <dt className="text-base font-semibold leading-7 text-foreground lg:col-span-5">
              {faq.question}
            </dt>
            <dd className="mt-4 lg:col-span-7 lg:mt-0">
              <p className="text-base leading-7 text-foreground/60">
                {faq.answer}
              </p>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
