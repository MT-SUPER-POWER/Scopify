import type { MusicCapability } from "@scopify/music-domain/capability";
import type { ReactNode } from "react";

export interface CapabilityGateProps {
  requires: MusicCapability;
  children: ReactNode;
  /** Shown instead when the active platform lacks the capability; nothing by default. */
  fallback?: ReactNode;
}

export interface RouteCapabilityGateProps {
  children: ReactNode;
}

/** A route that only works on platforms with a capability; `prefix` also matches sub-paths. */
export interface ProviderRouteRequirement {
  prefix: string;
  requires: MusicCapability;
  /** Match `prefix` only, not paths below it. */
  exact?: boolean;
}
