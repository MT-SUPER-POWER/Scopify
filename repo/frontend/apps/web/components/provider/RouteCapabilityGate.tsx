"use client";

import { usePathname } from "next/navigation";

import { UnsupportedPlatformState } from "@/components/provider/UnsupportedPlatformState";
import { useActiveProvider } from "@/hooks/provider/useActiveProvider";
import { routeCapability } from "@/lib/providers/routeCapability";
import type { RouteCapabilityGateProps } from "@/types/music/providerComponents";

/**
 * Wraps the dashboard's route content. A page the active platform cannot provide is replaced
 * by the unsupported state before it mounts, so none of its requests are sent.
 */
export function RouteCapabilityGate({ children }: RouteCapabilityGateProps) {
  const pathname = usePathname();
  const { capabilities } = useActiveProvider();
  const required = routeCapability(pathname);
  if (required && !capabilities.has(required)) return <UnsupportedPlatformState />;
  return children;
}
