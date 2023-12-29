import { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy - Caley.ai",
  description: "Privacy Policy - Caley.ai",
};

export default function Terms() {
  return <LegalPage date={""} title={""} content={""} />;
}
