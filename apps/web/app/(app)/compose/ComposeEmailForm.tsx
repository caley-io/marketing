"use client";

import React, { useCallback } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import useSWR from "swr";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { isError } from "@/utils/error";
import { ContactsResponse } from "@/app/api/google/contacts/route";
import { Combobox } from "@/components/Combobox";
import { SendEmailBody, SendEmailResponse } from "@/utils/gmail/mail";
import { postRequest } from "@/utils/api";
import { openComposeAtom } from "@/utils/store";
import { useAtom } from "jotai";
import { toast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { EmailPullRequest, TeamContext } from "@/utils/emailPr";
import { EmailPrReviewPanel } from "@/components/mail/EmailPrReviewPanel";

interface EmailPrListResponse {
  teamContext: TeamContext;
  canSendDirectly: boolean;
  pullRequests: EmailPullRequest[];
}

export const ComposeEmailForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm<SendEmailBody>();

  const [, setComposeOpen] = useAtom(openComposeAtom);
  const [prLabelsInput, setPrLabelsInput] = React.useState("");
  const [prReviewersInput, setPrReviewersInput] = React.useState("");

  const { data: prData, mutate: mutatePrData } = useSWR<EmailPrListResponse>(
    "/api/mail/pr",
  );

  const canSendDirectly = prData?.canSendDirectly ?? true;

  const createEmailPullRequest = useCallback(
    async (data: SendEmailBody) => {
      try {
        const labels = prLabelsInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const reviewers = prReviewersInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        const res = await postRequest<
          { pullRequest: EmailPullRequest },
          SendEmailBody & { labels: string[]; reviewers: string[] }
        >("/api/mail/pr", {
          ...data,
          labels,
          reviewers,
        });

        if (isError(res)) {
          toast({
            title: "Error",
            description: "Failed to create Email PR.",
          });
        } else {
          toast({
            title: "Email PR Created",
            description: "Your email is now open for team review and approval.",
          });
          reset();
          setPrLabelsInput("");
          setPrReviewersInput("");
          mutatePrData();
        }
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Failed to create Email PR.",
        });
      }
    },
    [mutatePrData, prLabelsInput, prReviewersInput, reset],
  );

  const onSubmit: SubmitHandler<SendEmailBody> = useCallback(
    async (data) => {
      if (!canSendDirectly) {
        await createEmailPullRequest(data);
        return;
      }

      try {
        const res = await postRequest<SendEmailResponse, SendEmailBody>(
          "/api/google/messages/send",
          data,
        );
        if (isError(res)) {
          setComposeOpen(false);
          toast({
            title: "Error",
            description: `There was an error sending the email :(`,
          });
        } else {
          setComposeOpen(false);
        }
        toast({ title: "Success", description: `Email sent!` });
      } catch (error) {
        console.error(error);
        setComposeOpen(false);
        toast({
          title: "Error",
          description: `There was an error sending the email :(`,
        });
      }
    },
    [canSendDirectly, createEmailPullRequest, setComposeOpen],
  );

  const [searchQuery, setSearchQuery] = React.useState("");
  const { data } = useSWR<ContactsResponse, { error: string }>(
    `/api/google/contacts?query=${searchQuery}`,
    {
      keepPreviousData: true,
    },
  );

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Combobox
            options={
              data?.result.map((contact) => ({
                value: contact.person?.emailAddresses?.[0].value!,
                label: `${contact.person?.names?.[0].displayName || ""} <${
                  contact.person?.emailAddresses?.[0].value || ""
                }>`,
              })) || []
            }
            placeholder="Select contact..."
            emptyText="No contacts found."
            value={watch("to")}
            onChangeValue={(value) => {
              setValue("to", value);
            }}
            search={searchQuery}
            onSearch={setSearchQuery}
          />
        </div>

        <div className="flex w-full items-center pt-2 text-sm font-medium text-foreground/60">
          <Separator className="mr-2 w-1/3" />
          Or
          <Separator className="ml-2 w-1/3" />
        </div>

        <Input
          type="text"
          name="to"
          label="Recipient"
          registerProps={register("to", { required: true })}
          error={errors.to}
        />

        <Input
          type="text"
          name="subject"
          label="Subject"
          registerProps={register("subject", { required: true })}
          error={errors.subject}
        />
        <Input
          type="text"
          as="textarea"
          rows={6}
          name="message"
          label="Message"
          registerProps={register("messageText", { required: true })}
          error={errors.messageText}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-foreground/80">
              PR Labels (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. announcement, copy-review"
              className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
              value={prLabelsInput}
              onChange={(e) => setPrLabelsInput(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground/80">
              Reviewers (comma-separated emails)
            </label>
            <input
              type="text"
              placeholder="e.g. editor@company.com"
              className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
              value={prReviewersInput}
              onChange={(e) => setPrReviewersInput(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canSendDirectly ? (
            <>
              <Button type="submit" loading={isSubmitting}>
                Send
              </Button>
              <Button
                type="button"
                color="white"
                loading={isSubmitting}
                onClick={handleSubmit(createEmailPullRequest)}
              >
                Create Email PR
              </Button>
            </>
          ) : (
            <Button type="submit" loading={isSubmitting}>
              Create Email PR
            </Button>
          )}
        </div>
      </form>

      {prData?.teamContext && (
        <EmailPrReviewPanel
          pullRequests={prData.pullRequests}
          teamContext={prData.teamContext}
          onRefresh={() => mutatePrData()}
        />
      )}
    </div>
  );
};
