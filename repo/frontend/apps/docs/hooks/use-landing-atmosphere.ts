"use client";

import { useContext } from "react";

import { LandingAtmosphereContext } from "@/lib/marketing/landing-atmosphere-context";

export function useLandingAtmosphere() {
  const context = useContext(LandingAtmosphereContext);
  if (!context) {
    throw new Error("useLandingAtmosphere must be used inside LandingAtmosphereProvider");
  }
  return context;
}
