"use client";

import { capitalCase } from "capital-case";
import { sortBy } from "lodash";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { DateRange } from "react-day-picker";
import Link from "next/link";
import { Text, Title } from "@tremor/react";
import { useExpanded } from "@/app/(app)/stats/useExpanded";
import { CategoryStatsResponse } from "@/app/api/user/stats/categories/route";
import { RecipientsResponse } from "@/app/api/user/stats/recipients/route";
import { SendersResponse } from "@/app/api/user/stats/senders/route";
import { LoadingContent } from "@/components/LoadingContent";
import { Skeleton } from "@/components/ui/skeleton";
import { BarList } from "@/components/charts/BarList";
import { getDateRangeParams } from "@/app/(app)/stats/params";
import { getGmailSearchUrl } from "@/utils/url";
import { Card } from "@/components/Card";
import { Button } from "@/components/ui/button";
import { usePremium } from "@/components/PremiumAlert";

export function EmailAnalytics(props: {
  dateRange?: DateRange | undefined;
  refreshInterval: number;
}) {
  const session = useSession();
  const email = session.data?.user.email;

  const params = getDateRangeParams(props.dateRange);

  const { data, isLoading, error } = useSWR<SendersResponse, { error: string }>(
    `/api/user/stats/senders?${new URLSearchParams(params as any)}`,
    {
      refreshInterval: props.refreshInterval,
    },
  );

  const {
    data: dataRecipients,
    isLoading: isLoadingRecipients,
    error: errorRecipients,
  } = useSWR<RecipientsResponse, { error: string }>(
    `/api/user/stats/recipients?${new URLSearchParams(params as any)}`,
    {
      refreshInterval: props.refreshInterval,
    },
  );
  const {
    data: dataCategories,
    isLoading: isLoadingCategories,
    error: errorCategories,
  } = useSWR<CategoryStatsResponse, { error: string }>(
    `/api/user/stats/categories?${new URLSearchParams(params as any)}`,
    {
      refreshInterval: props.refreshInterval,
    },
  );

  const { isPremium } = usePremium();

  const { expanded, extra } = useExpanded();

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <LoadingContent
        loading={isLoading}
        error={error}
        loadingComponent={<Skeleton className="h-64 w-full rounded" />}
      >
        {data && (
          <BarList
            title="Who emails you most"
            // subtitle="Last 50 emails"
            col1="Sender"
            col2="Emails"
            data={data.mostActiveSenderEmails
              .slice(0, expanded ? undefined : 5)
              .map((d) => ({
                ...d,
                href: getGmailSearchUrl(d.name, email),
                target: "_blank",
              }))}
            extra={extra}
          />
        )}
      </LoadingContent>
      <LoadingContent
        loading={isLoading}
        error={error}
        loadingComponent={<Skeleton className="h-64 w-full rounded" />}
      >
        {data && (
          <BarList
            title="Domains that email you most"
            // subtitle="Last 50 emails"
            col1="Domain"
            col2="Emails"
            data={data.mostActiveSenderDomains
              .slice(0, expanded ? undefined : 5)
              .map((d) => ({
                ...d,
                href: getGmailSearchUrl(d.name, email),
                target: "_blank",
              }))}
            extra={extra}
          />
        )}
      </LoadingContent>
      <LoadingContent
        loading={isLoadingRecipients}
        error={errorRecipients}
        loadingComponent={<Skeleton className="h-64 w-full rounded" />}
      >
        {dataRecipients && (
          <BarList
            title="Who you email the most"
            // subtitle="Last 50 emails"
            col1="Recipient"
            col2="Emails"
            data={dataRecipients.mostActiveRecipientEmails
              .slice(0, expanded ? undefined : 5)
              .map((d) => ({
                ...d,
                href: getGmailSearchUrl(d.name, email),
                target: "_blank",
              }))}
            extra={extra}
          />
        )}
      </LoadingContent>
    </div>
  );
}
