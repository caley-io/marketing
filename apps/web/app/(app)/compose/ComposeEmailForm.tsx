"use client";

import React, { useCallback } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import useSWR from "swr";
import { Button } from "@/components/Button";
import { Input, Label } from "@/components/Input";
import { toastSuccess, toastError } from "@/components/Toast";
import { isError } from "@/utils/error";
import { ContactsResponse } from "@/app/api/google/contacts/route";
import { Combobox } from "@/components/Combobox";
import { SendEmailBody, SendEmailResponse } from "@/utils/gmail/mail";
import { postRequest } from "@/utils/api";
import { openComposeAtom } from "@/utils/store";
import { useAtom } from "jotai";
import { toast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { Sparkle } from "lucide-react";

export const ComposeEmailForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<SendEmailBody>();

  const [composeOpen, setComposeOpen] = useAtom(openComposeAtom);

  const onSubmit: SubmitHandler<SendEmailBody> = useCallback(
    async (data) => {
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
    [setComposeOpen],
  );

  const [searchQuery, setSearchQuery] = React.useState("");
  const { data, isLoading, error } = useSWR<
    ContactsResponse,
    { error: string }
  >(`/api/google/contacts?query=${searchQuery}`, {
    keepPreviousData: true,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
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

      <Button type="submit" loading={isSubmitting}>
        Send
      </Button>
    </form>
  );
};
