"use client";

import React, { useCallback, useMemo } from "react";
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
import {
  openComposeAtom,
  calendarSidebarOpenAtom,
  calendarTargetDateAtom,
} from "@/utils/store";
import { useAtom, useSetAtom } from "jotai";
import { toast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, PlusCircle } from "lucide-react";
import {
  extractDateEntities,
  generateAvailabilitySnippet,
  type DateEntity,
} from "@/utils/dateNlu";

export const ComposeEmailForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<SendEmailBody>();

  const [composeOpen, setComposeOpen] = useAtom(openComposeAtom);
  const setCalendarOpen = useSetAtom(calendarSidebarOpenAtom);
  const setCalendarTargetDate = useSetAtom(calendarTargetDateAtom);

  const messageText = watch("messageText") || "";
  const detectedDates = useMemo(() => {
    return extractDateEntities(messageText);
  }, [messageText]);

  const handleOpenCalendarForDate = (entity: DateEntity) => {
    setCalendarTargetDate(entity.targetDate);
    setCalendarOpen(true);
  };

  const handleInsertAvailability = (entity: DateEntity) => {
    const snippet = generateAvailabilitySnippet(entity.targetDate);
    const current = watch("messageText") || "";
    const updated = current ? `${current}\n\n${snippet}` : snippet;
    setValue("messageText", updated, { shouldValidate: true, shouldDirty: true });
  };

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

      {/* Natural Language Date Understanding & Calendar Availability bar */}
      {detectedDates.length > 0 && (
        <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 p-3 space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Dates detected in message ({detectedDates.length})
            </span>
            <span className="text-[10px] text-muted-foreground">
              Click to inspect availability or insert times
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {detectedDates.map((entity, i) => (
              <div
                key={`${entity.targetDate}-${i}`}
                className="flex items-center gap-1.5 bg-background border rounded-md px-2.5 py-1 text-xs shadow-sm hover:border-sky-500/70 transition-colors"
              >
                <span className="font-semibold text-foreground">
                  &ldquo;{entity.text}&rdquo;
                </span>
                <span className="text-muted-foreground">
                  ({entity.formattedDisplay})
                </span>
                <div className="flex items-center gap-1.5 ml-1 border-l pl-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenCalendarForDate(entity)}
                    className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 font-medium text-[11px] underline underline-offset-2 flex items-center gap-1"
                  >
                    <Clock className="h-3 w-3" />
                    Check schedule
                  </button>
                  <span className="text-muted-foreground/30">|</span>
                  <button
                    type="button"
                    onClick={() => handleInsertAvailability(entity)}
                    className="text-muted-foreground hover:text-foreground text-[11px] flex items-center gap-0.5"
                    title="Insert availability template into message"
                  >
                    <PlusCircle className="h-3 w-3" />
                    Insert times
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button type="submit" loading={isSubmitting}>
        Send
      </Button>
    </form>
  );
};
