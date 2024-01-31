import Image from "next/image";
import { CTAButtons } from "@/app/(landing)/home/CTAButtons";
import { SparklesIcon } from "lucide-react";
import TestimonialsAvatars from "../components/testimonials-avatar";

export function HeroText(props: { children: React.ReactNode }) {
  return (
    <h1
      className="relative z-20 bg-gradient-to-b from-neutral-100 to-neutral-500 bg-clip-text font-cal text-4xl font-bold text-transparent sm:text-7xl"
      {...props}
    />
  );
}

export function HeroSubtitle(props: { children: React.ReactNode }) {
  return <p className="mt-6 text-lg leading-8 text-foreground/60" {...props} />;
}

export function Hero(props: {
  title?: string;
  subtitle?: string;
  image?: string;
}) {
  return (
    <div
      className="relative flex items-center justify-center  bg-white pt-14 bg-dot-black/[0.3] dark:bg-black dark:bg-dot-white/[0.3]"
      id="hero"
    >
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black"></div>
      <div className="pt-24 sm:pb-12 sm:pt-32">
        <div className="mx-auto max-w-7xl items-center px-6 lg:px-8">
          {/* <HeroTag /> */}

          <div className="mx-auto flex max-w-3xl flex-col items-center justify-center text-center">
            <div className="gradient-box z-10 mb-8 rounded-full px-6 py-2.5 font-cal text-sm font-medium">
              <span className="relative z-30">
                Pay Once Use Forever{" "}
                <SparklesIcon className="mb-1 inline-block h-4 w-4" />
              </span>
            </div>
            <HeroText>Emails</HeroText>
            <HeroText>But Smart and Beautiful</HeroText>
            <HeroSubtitle>
              {props.subtitle || (
                <>
                  AI Superpowers, Conversations, Newsletter management, and
                  email analytics.
                  <br />
                  Caley.io is the open-source email client that you deserve.
                </>
              )}
            </HeroSubtitle>
            <CTAButtons />
          </div>

          <div className="mt-16 flow-root sm:mt-24">
            <div className="relative -m-2 rounded-xl bg-foreground/5 p-2 ring-1 ring-inset ring-foreground/10 lg:-m-4 lg:rounded-2xl lg:p-4">
              <Image
                src={props.image || "/images/email.png"}
                alt="Inbox screenshot"
                width={2432}
                height={1442}
                className="rounded-md shadow ring-1 ring-foreground/10"
              />

              {/* <VideoDemo /> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// function HeroTag() {
//   return (
//     <div className="mb-8 flex justify-center bg-white">
//       <div className="relative flex items-center gap-x-4 rounded-full px-4 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20">
//         <a
//           href="/product-hunt"
//           className="flex items-center gap-x-1 font-semibold text-blue-600"
//         >
//           <span className="absolute inset-0" aria-hidden="true" />
//           We are live on Product Hunt!
//           <ChevronRightIcon
//             className="-mr-2 h-5 w-5 text-gray-400"
//             aria-hidden="true"
//           />
//         </a>
//       </div>
//     </div>
//   );
// }

function ProductHuntBadge() {
  return (
    <div className="flex justify-center pt-8">
      <a
        href="https://www.producthunt.com/posts/inbox-zero-2?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-inbox&#0045;zero&#0045;2"
        target="_blank"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=431438&theme=light"
          alt="Inbox&#0032;Zero - Clean&#0032;up&#0032;your&#0032;inbox&#0032;in&#0032;minutes&#0044;&#0032;open&#0032;source | Product Hunt"
          className="h-[54px] w-[250px]"
          width="250"
          height="54"
        />
      </a>
    </div>
  );
}
