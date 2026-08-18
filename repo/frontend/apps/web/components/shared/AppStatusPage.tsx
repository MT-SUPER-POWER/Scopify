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
    <main className="grid min-h-dvh w-full place-items-center bg-surface p-8 font-sans text-content">
      <section
        aria-labelledby="app-status-title"
        className="flex w-full max-w-2xl items-stretch justify-center"
      >
        <p className="flex min-h-24 items-center self-stretch border-r border-content/20 pr-8 font-status-code text-5xl leading-none font-normal tracking-normal tabular-nums sm:text-6xl">
          {statusCode ?? "!"}
        </p>

        <div className="min-w-0 py-1 pl-6">
          <h1 id="app-status-title" className="text-base font-semibold tracking-tight">
            {title}
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-6 text-content-muted">{description}</p>

          <div className="mt-4 flex items-center gap-4 text-sm">
            {onRetry ? (
              <button
                type="button"
                className="rounded-sm text-content-muted underline decoration-transparent underline-offset-4 transition-colors hover:text-content hover:decoration-current focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                onClick={onRetry}
              >
                {retryLabel}
              </button>
            ) : null}
            <Link
              href="/"
              className="rounded-sm text-content-muted underline decoration-transparent underline-offset-4 transition-colors hover:text-content hover:decoration-current focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              {homeLabel}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
