import { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service - Inbox Zero",
  description: "Terms of Service - Inbox Zero",
};

export default function Terms() {
  return <LegalPage date={""} title={""} content={""} />;
}
