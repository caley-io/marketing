"use client";

import useSWR from "swr";
import { LoadingContent } from "@/components/LoadingContent";
import { PlannedResponse } from "@/app/api/user/planned/route";
import { AlertBasic } from "@/components/Alert";

export function Planned() {
  const { data, isLoading, error, mutate } = useSWR<PlannedResponse>(
    "/api/user/planned",
    {
      keepPreviousData: true,
      dedupingInterval: 1_000,
    },
  );

  return null;
}
