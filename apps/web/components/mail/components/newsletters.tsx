import { useNewsletterFilter } from "@/app/(app)/newsletters/common";
import { ActionBar } from "@/app/(app)/stats/ActionBar";
import { useEmailsToIncludeFilter } from "@/app/(app)/stats/EmailsToIncludeFilter";
import { LoadStatsButton } from "@/app/(app)/stats/LoadStatsButton";
import { getDateRangeParams } from "@/app/(app)/stats/params";
import {
  NewsletterStatsQuery,
  NewsletterStatsResponse,
} from "@/app/api/user/stats/newsletters/route";
import { LoadingContent } from "@/components/LoadingContent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResizablePanel } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useStatLoader } from "@/providers/StatLoaderProvider";
import { ProgressBar } from "@tremor/react";
import { formatDistanceToNow, subDays } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import useSWR from "swr";

const selectOptions = [
  { label: "Last week", value: "7" },
  { label: "Last month", value: "30" },
  { label: "Last 3 months", value: "90" },
  { label: "Last year", value: "365" },
  { label: "All", value: "0" },
];
const defaultSelected = selectOptions[2];

export function Newsletters() {
  const [dateDropdown, setDateDropdown] = useState<string>(
    defaultSelected.label,
  );

  const onSetDateDropdown = useCallback(
    (option: { label: string; value: string }) => {
      const { label } = option;
      setDateDropdown(label);
    },
    [],
  );

  const now = useMemo(() => new Date(), []);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(now, parseInt(defaultSelected.value)),
    to: now,
  });

  const { isLoading: isStatsLoading, onLoad } = useStatLoader();
  const refreshInterval = isStatsLoading ? 3_000 : 1_000_000;

  useEffect(() => {
    onLoad({ loadBefore: false, showToast: false });
  }, [onLoad]);

  const [sortColumn, setSortColumn] = useState<
    "emails" | "unread" | "unarchived"
  >("emails");

  const { typesArray, types, setTypes } = useEmailsToIncludeFilter();
  const { filtersArray, filters, setFilters } = useNewsletterFilter();

  const params: NewsletterStatsQuery = {
    types: typesArray,
    filters: filtersArray,
    orderBy: sortColumn,
    limit: 100,
    ...getDateRangeParams(dateRange),
  };
  const urlParams = new URLSearchParams(params as any);
  const { data, isLoading, error, mutate } = useSWR<
    NewsletterStatsResponse,
    { error: string }
  >(`/api/user/stats/newsletters?${urlParams}`, {
    refreshInterval: refreshInterval,
    keepPreviousData: true,
  });
  return (
    <ResizablePanel defaultSize={1095} className="h-screen">
      <div className="sticky top-0 z-10 flex border-b bg-background px-4 py-2 shadow sm:justify-between">
        <div />
        <div className="space-y-1 sm:flex sm:space-x-1 sm:space-y-0">
          <ActionBar
            selectOptions={selectOptions}
            dateDropdown={dateDropdown}
            setDateDropdown={onSetDateDropdown}
            dateRange={dateRange}
            setDateRange={setDateRange}
          />
          <LoadStatsButton />
        </div>
      </div>
      <ScrollArea className="h-screen pb-32 pt-4">
        <LoadingContent
          loading={!data && isLoading}
          error={error}
          loadingComponent={<Skeleton className="m-4 h-screen rounded" />}
        >
          <div className="flex flex-col gap-2 p-4 pt-0">
            {data &&
              data.newsletters.map((item, index) => {
                const readPercentage = (item.readEmails / item.value) * 100;
                const archivedEmails = item.value - item.inboxEmails;
                const archivedPercentage = (archivedEmails / item.value) * 100;

                return (
                  <div
                    key={index}
                    className="flex w-full flex-col items-center gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent"
                  >
                    <div className="flex w-full justify-between">
                      <div className="flex w-full flex-col gap-1">
                        <div className="flex items-center">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">{item.name}</div>
                          </div>
                        </div>
                        <div className="text-xs font-medium text-foreground/60">
                          Number of emails: {item.value}
                        </div>
                      </div>

                      <div className="mr-8 flex items-center justify-center space-x-4">
                        <div className="flex flex-col">
                          <div className="text-xs font-semibold">Reads</div>
                          <ProgressBar
                            label={`${Math.round(readPercentage)}%`}
                            value={readPercentage}
                            tooltip={`${item.readEmails} read. ${
                              item.value - item.readEmails
                            } unread.`}
                            color="blue"
                            className="min-w-[200px]"
                          />
                        </div>
                        <div className="flex flex-col">
                          <div className="text-xs font-semibold">Archived</div>
                          <ProgressBar
                            label={`${Math.round(archivedPercentage)}%`}
                            value={archivedPercentage}
                            tooltip={`${archivedEmails} archived. ${item.inboxEmails} unarchived.`}
                            color="blue"
                            className="min-w-[200px]"
                          />
                        </div>
                      </div>

                      <div>
                        <Button
                          size={"sm"}
                          disabled={!item.lastUnsubscribeLink}
                          onClick={() => {
                            window.open(item.lastUnsubscribeLink, "_blank");
                          }}
                        >
                          Unsubscribe
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </LoadingContent>
      </ScrollArea>
    </ResizablePanel>
  );
}
