import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import NotFound from "@/app/not-found";
import { AppStatusPage } from "@/components/shared/AppStatusPage";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { translate } from "@/lib/i18n";
import { useI18nStore } from "@/store/module/i18n";

describe("AppStatusPage", () => {
  test("loads and maps the status-code font through the global theme entry", async () => {
    const globalStyles = await Bun.file("app/globals.css").text();

    expect(globalStyles).toContain('@import "@fontsource/black-ops-one/400.css"');
    expect(globalStyles).toContain('--font-status-code: "Black Ops One", var(--font-ui)');
  });

  test("uses a clean token-backed text layout with retry and home actions", () => {
    const markup = renderToStaticMarkup(
      <AppStatusPage
        description="The page cannot continue."
        homeLabel="Back to Home"
        onRetry={() => undefined}
        retryLabel="Try again"
        title="Something went wrong"
      />,
    );

    expect(markup).toContain("bg-surface");
    expect(markup).toContain("text-content");
    expect(markup).toContain("font-sans");
    expect(markup).toContain("font-status-code");
    expect(markup).toContain("sm:text-6xl");
    expect(markup).toContain("border-content/20");
    expect(markup).not.toContain("bg-surface-raised");
    expect(markup).not.toContain("shadow-panel");
    expect(markup).toContain("Try again");
    expect(markup).toContain('href="/"');
    expect(markup).toContain("Back to Home");
  });

  test("renders a focused 404 state without a retry action", () => {
    const markup = renderToStaticMarkup(
      <AppStatusPage
        description="That page does not exist."
        homeLabel="Back to Home"
        statusCode="404"
        title="Page not found"
      />,
    );

    expect(markup).toContain("404");
    expect(markup).toContain("Page not found");
    expect(markup).not.toContain("Try again");
    expect(markup).toContain('href="/"');
  });

  test("wires localized actions into the Next.js runtime error fallback", () => {
    const locale = useI18nStore.getState().locale;
    const markup = renderToStaticMarkup(
      <ErrorFallback error={new Error("render failed")} reset={() => undefined} />,
    );

    expect(markup).toContain(translate(locale, "errorPage.unexpected.title"));
    expect(markup).toContain("500");
    expect(markup).toContain(translate(locale, "common.action.retry"));
    expect(markup).toContain(translate(locale, "ui.backToHome"));
  });

  test("wires the root not-found convention to the localized 404 state", () => {
    const locale = useI18nStore.getState().locale;
    const markup = renderToStaticMarkup(<NotFound />);

    expect(markup).toContain("404");
    expect(markup).toContain(translate(locale, "errorPage.notFound.title"));
    expect(markup).toContain(translate(locale, "ui.backToHome"));
  });
});
