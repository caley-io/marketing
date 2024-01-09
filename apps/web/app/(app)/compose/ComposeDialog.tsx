"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ComposeEmailForm } from "./ComposeEmailForm";
import { useAtom } from "jotai";
import { openComposeAtom } from "@/utils/store";

export const ComposeDialog = () => {
  const [composeOpen, setComposeOpen] = useAtom(openComposeAtom);
  return (
    <Dialog
      open={composeOpen}
      onOpenChange={() => setComposeOpen(!composeOpen)}
    >
      <DialogContent className="sm:max-w-[625px]">
        <ComposeEmailForm />
      </DialogContent>
    </Dialog>
  );
};
