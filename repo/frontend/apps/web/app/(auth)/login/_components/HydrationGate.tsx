import type { LoginHydrationGateProps } from "@/types/auth/login";

let hydrationReady = false;
let hydrationPromise: Promise<void> | null = null;

export function HydrationGate({ children }: LoginHydrationGateProps) {
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
