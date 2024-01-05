import Link from "next/link";

const navigation = {
  main: [
    { name: "Newsletter Cleaner", href: "/newsletter-cleaner" },
    { name: "Email Analytics", href: "/email-analytics" },
    { name: "Email AI Automation", href: "/ai-automation" },
    { name: "New Sender Management", href: "/new-email-senders" },
    { name: "Open Source", href: "/github", target: "_blank" },
    { name: "OSS Friends", href: "/oss-friends" },
  ],
  support: [
    { name: "Pricing", href: "/#pricing" },
    { name: "Feature Requests", href: "/feature-requests", target: "_blank" },
    { name: "Roadmap", href: "/roadmap", target: "_blank" },
  ],
  company: [
    { name: "Affiliates", href: "/affiliates", target: "_blank" },
    { name: "Twitter", href: "https://x.com/geekpreneur_", target: "_blank" },
  ],
  social: [
    {
      name: "Twitter",
      href: "https://twitter.com/geekpreneur_",
      target: "_blank",
      icon: (props: any) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
        </svg>
      ),
    },
  ],
};

export function Footer() {
  return (
    <footer className="relative z-50">
      <div className="mx-auto max-w-7xl overflow-hidden px-6 py-20 sm:py-24 lg:px-8">
        {/* <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
          <div className="md:grid md:grid-cols-2 md:gap-8">
            <div>
              <FooterList title="Product" items={navigation.main} />
            </div>
            <div className="mt-10 md:mt-0">
              <FooterList title="Support" items={navigation.support} />
            </div>
          </div>
          <div className="md:grid md:grid-cols-2 md:gap-8">
            <div>
              <FooterList title="Company" items={navigation.company} />
            </div>
          </div>
        </div> */}

        <div className="mt-16 flex justify-center space-x-10">
          {navigation.social.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              target={item.target}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">{item.name}</span>
              <item.icon className="h-6 w-6" aria-hidden="true" />
            </Link>
          ))}
        </div>
        <p className="mt-10 text-center text-xs leading-5 text-gray-500">
          Made with ❤️ in South of France.
        </p>
        <p className="mt-4 text-center text-xs leading-5 text-gray-500">
          &copy; {new Date().getFullYear()} Caley.io. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function FooterList(props: {
  title: string;
  items: { name: string; href: string; target?: string }[];
}) {
  return (
    <>
      <h3 className="text-sm font-semibold leading-6 text-foreground">
        {props.title}
      </h3>
      <ul role="list" className="mt-6 space-y-4">
        {props.items.map((item) => (
          <li key={item.name}>
            <a
              href={item.href}
              target={item.target}
              className="text-sm leading-6 text-foreground/60 hover:text-foreground"
            >
              {item.name}
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
