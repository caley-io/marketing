import { Header } from "@/app/(landing)/home/Header";
import { Hero } from "@/app/(landing)/home/Hero";
import {
  Features,
  FeaturesAutomation,
  FeaturesCalendar,
  FeaturesKeyboard,
  FeaturesNewsletter,
  FeaturesStats,
  FeaturesUnsubscribe,
} from "@/app/(landing)/home/Features";
import { Pricing } from "@/app/(app)/premium/Pricing";
import { FAQs } from "@/app/(landing)/home/FAQs";
import { CTA } from "@/app/(landing)/home/CTA";
import { Footer } from "@/app/(landing)/home/Footer";

export default function Home() {
  return (
    <div className="bg-black">
      <Header />

      <main className="isolate">
        <Hero />
        {/* <LogoCloud /> */}
        {/* <Testimonials /> */}
        <Features />
        <FeaturesUnsubscribe />
        <FeaturesStats />
        <FeaturesAutomation />
        <FeaturesNewsletter />
        <FeaturesKeyboard />
        <FeaturesCalendar />
        <Pricing />
        <FAQs />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}
