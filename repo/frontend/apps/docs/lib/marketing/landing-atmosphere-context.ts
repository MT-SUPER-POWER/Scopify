"use client";

import { createContext } from "react";

import type { LandingAtmosphereValue } from "@/types/marketing";

export const LandingAtmosphereContext = createContext<LandingAtmosphereValue | undefined>(
  undefined,
);
