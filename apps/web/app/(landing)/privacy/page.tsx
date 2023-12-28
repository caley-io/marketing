import { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy - Inbox Zero",
  description: "Privacy Policy - Inbox Zero",
};

export default function Terms() {
  return <LegalPage date={""} title={""} content={""} />;
}
