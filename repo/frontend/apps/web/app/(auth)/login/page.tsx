"use client";

import { Suspense } from "react";
import { HydrationGate } from "./_components/HydrationGate";
import { LoginForm } from "./_components/LoginForm";
import LoginSkeletonLoading from "./_components/LoginSkeletonLoading";

export default function Page() {
  return (
    <Suspense fallback={<LoginSkeletonLoading />}>
      <HydrationGate>
        <LoginForm />
      </HydrationGate>
    </Suspense>
  );
}
