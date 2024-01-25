"use client";

import { Button } from "@/components/Button";
import { usePostHog } from "posthog-js/react";
import { Input } from "@/components/ui/input";
import { createContact, getContact } from "@/utils/loops";
import { useCallback, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

export function Waitlist() {
  const posthog = usePostHog();

  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    posthog.capture("Clicked Join the waitlist");

    const found = await getContact(email);
    if (found && found.contacts && found.contacts.length > 0) {
      setAlreadySubmitted(true);
      setLoading(false);
    }

    await createContact(email);

    setIsSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="mt-8 grid w-full items-center justify-center gap-x-4 gap-y-2 sm:flex">
      {isSubmitted ? (
        <div className="flex text-foreground/60">
          <CheckCircle2 className="mr-2 text-green-400" />
          {alreadySubmitted
            ? "You already joined the waitlist"
            : "Thanks for joining the waitlist!"}
        </div>
      ) : (
        <>
          <Input
            className="h-12 max-w-sm bg-black"
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button color="primary" size="2xl" onClick={onSubmit}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? "Joinning..." : "Join the waitlist"}
          </Button>
        </>
      )}
    </div>
  );
}
