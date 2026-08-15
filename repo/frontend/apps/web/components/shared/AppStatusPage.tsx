"use client";

import Link from "next/link";

import type { AppStatusPageProps } from "@/types/components/error";

export function AppStatusPage({
  description,
  homeLabel,
  onRetry,
  retryLabel,
  statusCode,
  title,
}: AppStatusPageProps) {
  return (
    <main className="bg-surface text-content grid min-h-dvh w-full place-items-center p-8 font-sans">
      <section
        aria-labelledby="app-status-title"
        className="flex w-full max-w-2xl items-stretch justify-center"
      >
        <p className="border-content/20 font-status-code flex min-h-24 items-center self-stretch border-r pr-8 text-5xl leading-none font-normal tracking-normal tabular-nums sm:text-6xl">
          {statusCode ?? "!"}
        </p>

        <div className="min-w-0 py-1 pl-6">
          <h1 id="app-status-title" className="text-base font-semibold tracking-tight">
            {title}
          </h1>
          <p className="text-content-muted mt-2 max-w-lg text-sm leading-6">{description}</p>

          <div className="mt-4 flex items-center gap-4 text-sm">
            {onRetry ? (
              <button
                type="button"
                className="text-content-muted hover:text-content focus-visible:ring-brand rounded-sm underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current focus-visible:ring-2 focus-visible:outline-none"
                onClick={onRetry}
              >
                {retryLabel}
              </button>
            ) : null}
            <Link
              href="/"
              className="text-content-muted hover:text-content focus-visible:ring-brand rounded-sm underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current focus-visible:ring-2 focus-visible:outline-none"
            >
              {homeLabel}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
