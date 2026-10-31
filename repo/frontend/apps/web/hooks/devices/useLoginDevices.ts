"use client";
import { useQuery } from "@tanstack/react-query";
import { getLoginDevices } from "@/lib/api/devices";
import { normalizeLoginDevices } from "@/lib/devices/normalize";
import { useI18nStore } from "@/store/module/i18n";
import { useDeviceSession } from "./useDeviceSession";

export function useLoginDevices() {
  const session = useDeviceSession();
  const locale = useI18nStore((state) => state.locale);
  const query = useQuery({
    queryKey: ["loginDevices", session.scope, locale],
    enabled: session.authenticated,
    meta: { scope: "account", persist: false },
    gcTime: 0,
    staleTime: 30_000,
    retry: false,
    queryFn: async ({ signal }) =>
      normalizeLoginDevices((await getLoginDevices(signal)).data, locale),
  });
  return { ...query, ...session };
}
