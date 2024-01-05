import { LampContainer, LampDemo } from "@/components/ui/lamp";
import clsx from "clsx";
import {
  BarChart2Icon,
  Brain,
  Calendar,
  EyeIcon,
  Focus,
  Gauge,
  HardDrive,
  Keyboard,
  LineChart,
  LucideIcon,
  MousePointer2Icon,
  Newspaper,
  Orbit,
  PersonStanding,
  Rocket,
  Space,
  Sparkles,
  Timer,
  Workflow,
} from "lucide-react";
import Image from "next/image";

const features = [
  {
    name: "Reply Automatically",
    description:
      "Tell Caley.io how to handle your emails and it will do it for you. Automatically reply, archive, and label emails based on your instructions.",
    icon: Sparkles,
  },
  {
    name: "Automatically archive cold emails",
    description:
      "Sick of cold emails? Caley.io can automatically archive and label them for you so they don't clog your inbox.",
    icon: Orbit,
  },
  {
    name: "Explain it in plain English",
    description:
      "Tell Caley.io how to handle your emails in plain English. It's as simple as writing to an assistant or ChatGPT.",
    icon: LineChart,
  },
];

function FeaturesOld() {
  return (
    <div className="bg-white py-24 sm:py-32" id="features">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="font-cal text-base leading-7 text-blue-600">
            Handle emails faster
          </h2>
          <p className="mt-2 font-cal text-3xl text-gray-900 sm:text-4xl">
            Respond faster. Remove the clutter. Get your time back.
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Running a small business you{"'"}re constantly bombarded with the
            same questions. Save your time and your customers time by having our
            AI answer them for you.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <feature.icon
                    className="h-5 w-5 flex-none text-blue-600"
                    aria-hidden="true"
                  />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                  {/* <p className="mt-6">
                    <a
                      href="#"
                      className="text-sm font-semibold leading-6 text-blue-600"
                    >
                      Learn more <span aria-hidden="true">→</span>
                    </a>
                  </p> */}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

export function Features() {
  return (
    <div className="bg-black py-24 sm:py-32" id="features">
      <LampDemo />
      {/* <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="font-cal text-base leading-7 text-blue-600">
            Privacy first
          </h2>
          <p className="mt-2 font-cal text-3xl text-foreground sm:text-4xl">
            Approved by Google. Open Source. See exactly what our code does. Or
            host it yourself.
          </p>
          <p className="mt-6 text-lg leading-8 text-foreground/60">
            Caley.io has undergone a thorough security process with Google to
            ensure the protection of your emails. You can even self-host Inbox
            Zero on your own infrastructure.
          </p>
        </div>
      </div> */}
    </div>
  );
}

export function FeaturesWithImage(props: {
  imageSide: "left" | "right";
  title: string;
  subtitle: string;
  description: string;
  image: string;
  features: {
    name: string;
    description: string;
    icon: LucideIcon;
  }[];
}) {
  return (
    <div className="overflow-hidden bg-black py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 items-center justify-center gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
          <div
            className={clsx(
              "lg:pt-4",
              props.imageSide === "left"
                ? "lg:ml-auto lg:pl-4"
                : "lg:mr-auto lg:pr-4",
            )}
          >
            <div className="lg:max-w-lg">
              <h2 className="inline-block bg-gradient-to-r from-blue-600 to-cyan-400 bg-clip-text font-cal text-base leading-7 text-transparent">
                {props.title}
              </h2>
              <p className="mt-2 font-cal text-3xl text-foreground sm:text-4xl">
                {props.subtitle}
              </p>
              <p className="mt-6 text-lg leading-8 text-foreground/80">
                {props.description}
              </p>
              <dl className="mt-10 max-w-xl space-y-8 text-base leading-7 text-foreground/60 lg:max-w-none">
                {props.features.map((feature) => (
                  <div key={feature.name} className="relative pl-9">
                    <dt className="inline font-semibold text-foreground">
                      <feature.icon
                        className="absolute left-1 top-1 h-5 w-5 text-blue-600"
                        aria-hidden="true"
                      />
                      {feature.name}
                    </dt>{" "}
                    <dd className="inline">{feature.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <div
            className={clsx(
              "relative flex items-start",
              props.imageSide === "left"
                ? "justify-end lg:order-first"
                : "justify-start lg:order-last",
            )}
          >
            <div className="relative rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-foreground/20 lg:rounded-2xl lg:p-4">
              <div className="absolute inset-0 h-full w-full scale-[0.90] transform rounded-full bg-red-500 bg-gradient-to-r from-blue-500 to-teal-500 blur-3xl" />
              <Image
                src={props.image}
                alt="Product screenshot"
                className="relative w-[48rem] max-w-none rounded-xl shadow-2xl ring-1 ring-foreground/20 sm:w-[57rem]"
                width={2400}
                height={1800}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const featuresCalendar = [
  {
    name: "Automated Event Creation",
    description:
      "Convert email plans into calendar events effortlessly. Let AI detect and set up your meetings from your conversations.",
    icon: Calendar,
  },
  {
    name: "Seamless Synchronization",
    description:
      "Keep your schedule in sync. Caley.io intelligently integrates with your existing calendar, ensuring no overlap or scheduling conflicts.",
    icon: Workflow,
  },
];

export function FeaturesCalendar() {
  return (
    <FeaturesWithImage
      imageSide="right"
      title="Smart Calendar Integration"
      subtitle="Orchestrate Your Schedule with Precision"
      description="Transform your email conversations into a perfectly synchronized calendar. AI-driven scheduling at its best."
      image="/images/keyboard.png"
      features={featuresCalendar}
    />
  );
}

const featuresKeyboard = [
  {
    name: "Streamlined Email Management",
    description:
      "Harness the power of keyboard shortcuts for rapid email processing. From composing to organizing, transform your keyboard into a command center.",
    icon: Keyboard,
  },
  {
    name: "Focused Workflow",
    description:
      "Enhance your productivity by minimizing reliance on mouse clicks. Navigate your inbox and execute tasks fluidly with intuitive keystrokes.",
    icon: Focus,
  },
];

export function FeaturesKeyboard() {
  return (
    <FeaturesWithImage
      imageSide="left"
      title="Keyboard Command Center"
      subtitle="Efficient Control at Your Fingertips"
      description="Step into a world where your keyboard does it all. Email management has never been this effortless."
      image="/images/keyboard.png"
      features={featuresKeyboard}
    />
  );
}

const featuresNewsletter = [
  {
    name: "Discover Email Dynamics",
    description:
      "Analyze your communication patterns. Identify who you interact with the most and the nature of your incoming emails, using these insights to optimize your email strategy.",
    icon: Rocket,
  },
  {
    name: "Data-Driven Decisions",
    description:
      "Transform complex analytics into actionable intelligence. Make strategic choices about managing your emails for a more efficient approach to communication.",
    icon: HardDrive,
  },
];

export function FeaturesNewsletter() {
  return (
    <FeaturesWithImage
      imageSide="right"
      title="Inbox Analytics"
      subtitle="Gain Deep Insights into Your Email Trends"
      description="Unlock the secrets of your inbox. Turn insights into strategies for smarter email management."
      image="/images/stats.png"
      features={featuresNewsletter}
    />
  );
}

const featuresAutomations = [
  {
    name: "One-Click Unsubscribe",
    description:
      "Simplify your inbox by unsubscribing from unwanted emails effortlessly. Manage your subscriptions with a single click for a cleaner email experience.",
    icon: Newspaper,
  },
  {
    name: "Analytic Insights",
    description:
      "Gain visibility into your subscription habits. Understand who sends the most and make informed decisions about your inbox clutter.",
    icon: Gauge,
  },
];

export function FeaturesAutomation() {
  return (
    <FeaturesWithImage
      imageSide="left"
      title="Newsletter Management"
      subtitle="Master Your Inbox Subscriptions"
      description="Transform the way you handle subscriptions. A clutter-free inbox is just a click away.

      "
      image="/images/newsletters.png"
      features={featuresAutomations}
    />
  );
}

const featuresStats = [
  {
    name: "Tailored Communication",
    description:
      "Our AI mimics your unique writing style, delivering personalized, authentic responses. Make every automated reply feel genuinely yours.",
    icon: Sparkles,
  },
  {
    name: "Intelligent Responses",
    description:
      "Effortlessly communicate with AI that grasps the context and tone, ensuring your messages resonate with each recipient.",
    icon: Orbit,
  },
];

export function FeaturesStats() {
  return (
    <FeaturesWithImage
      imageSide="right"
      title="Customized Email Responses"
      subtitle="Craft Perfect Replies with AI"
      description="Experience the future of emailing with AI-crafted responses that speak in your voice. Tailored, intelligent, and uniquely yours."
      image="/images/stats.png"
      features={featuresStats}
    />
  );
}

const featuresUnsubscribe = [
  {
    name: "Time-Saving Intelligence",
    description:
      "Let our AI be your personal email wizard. It learns your habits, sorts your emails, and prioritizes your tasks, freeing you to focus on high-impact work.",
    icon: Timer,
  },
  {
    name: "Smart Interaction",
    description:
      "Engage in a dynamic email experience where AI suggestions are so intuitive, they feel like second nature. Automated yet personalized, this is where your emails become a breeze to handle.",
    icon: Brain,
  },
];

export function FeaturesUnsubscribe() {
  return (
    <FeaturesWithImage
      imageSide="left"
      title="AI-Powered Efficiency"
      subtitle="Unleash the Potential of Your Inbox"
      description="Imagine an inbox that not only understands you but also acts on your behalf. With Caley.io, dive into an email experience where AI does the heavy lifting. It's not just about managing emails; it's about reclaiming your time and focusing on what truly matters."
      image="/images/newsletters.png"
      features={featuresUnsubscribe}
    />
  );
}
