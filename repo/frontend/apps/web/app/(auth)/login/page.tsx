"use client";

import { Suspense } from "react";
import type { LoginHydrationGateProps } from "@/types/auth/login";
import { LoginForm } from "./_components/LoginForm";
import LoginSkeletonLoading from "./_components/LoginSkeletonLoading";

let hydrationReady = false;
let hydrationPromise: Promise<void> | null = null;

function HydrationGate({ children }: LoginHydrationGateProps) {
  if (!hydrationReady && typeof window !== "undefined") {
    if (!hydrationPromise) {
      hydrationPromise = new Promise((resolve) => {
        requestAnimationFrame(() => {
          hydrationReady = true;
          resolve();
        });
      });
    }
    throw hydrationPromise;
  }

  return <>{children}</>;
}

export default function Page() {
  return (
    <Suspense fallback={<LoginSkeletonLoading />}>
      <HydrationGate>
        <LoginForm />
      </HydrationGate>
    </Suspense>
  );
}
