import { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/app/(landing)/login/LoginForm";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to Caley.io.",
};

export default function AuthenticationPage() {
  return (
    <div className="flex h-screen flex-col justify-center text-foreground">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col text-center">
          <h1 className="font-cal text-2xl">Sign In</h1>
          <p className="mt-4">Your AI personal assistant for email.</p>
        </div>
        <div className="mt-4">
          <LoginForm />
        </div>

        <p className="px-8 pt-10 text-center text-sm text-foreground/60">
          By clicking continue, you agree to our{" "}
          <Link
            href="/terms"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Privacy Policy
          </Link>
          .
        </p>

        <p className="px-4 pt-4 text-center text-sm text-foreground/60">
          Caley.io{"'"}s use and transfer of information received from Google
          APIs to any other app will adhere to{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Google API Services User Data
          </a>{" "}
          Policy, including the Limited Use requirements.
        </p>
      </div>
    </div>
  );
}
