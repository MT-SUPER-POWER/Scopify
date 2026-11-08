"use client";

import { useProviderCapability } from "@/hooks/provider/useActiveProvider";
import type { CapabilityGateProps } from "@/types/music/providerComponents";

/** Renders its children only when the active platform has the capability. */
export function CapabilityGate({ requires, children, fallback = null }: CapabilityGateProps) {
  return useProviderCapability(requires) ? children : fallback;
}
