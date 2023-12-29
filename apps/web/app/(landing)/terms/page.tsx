import { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service - Caley.ai",
  description: "Terms of Service - Caley.ai",
};

export default function Terms() {
  return <LegalPage date={""} title={""} content={""} />;
}
