"use client";
import { useLoginDevices } from "@/hooks/devices/useLoginDevices";
import { useTranslation } from "react-i18next";

import { Button } from "@scopify/ui/shadcn/components/button";
import { openLoginWindowOrFallback } from "@/lib/runtime/login";
import { runtime } from "@/lib/runtime";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { LoginDevicesHeader } from "./LoginDevicesHeader";
import { LoginDevicesContent } from "./LoginDevicesContent";
// 页面根是容器查询的参照；按钮焦点环沿用整页统一的描边样式
const pageClass =
  "@container mx-auto max-w-[1440px] px-[34px] py-8 text-foreground max-[700px]:px-[18px] max-[700px]:pt-6 max-[700px]:pb-7 [&_button:focus-visible]:rounded-[5px] [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-ring [&_button:focus-visible]:outline-solid";
const pageStateClass =
  "flex flex-col items-center gap-5 px-5 py-[72px] text-center text-muted-foreground";
const pageStateTitleClass = "text-[20px] font-semibold text-foreground";
export function LoginDevices() {
  const query = useLoginDevices();
  const { t } = useTranslation();
  const router = useSmartRouter();
  const login = () =>
    openLoginWindowOrFallback(runtime.auth, () => router.push("/login?redirect=/setting/devices"));
  return (
    <div className={pageClass}>
      <LoginDevicesHeader
        allowance={query.data?.allowance ?? null}
        refreshing={query.isFetching}
        onRefresh={() => void query.refetch()}
        authenticated={query.authenticated}
      />
      {!query.authenticated ? (
        <div className={pageStateClass}>
          <h2 className={pageStateTitleClass}>{t("devices.loginRequired")}</h2>
          <Button onClick={login}>{t("devices.loginAction")}</Button>
        </div>
      ) : query.isPending ? (
        <div className={pageStateClass} role="status" aria-live="polite">
          <div className="h-60 w-full rounded-[16px] bg-muted" />
          <p>{t("devices.loading")}</p>
        </div>
      ) : query.isError && !query.data ? (
        <div className={pageStateClass} role="alert">
          <h2 className={pageStateTitleClass}>{t("devices.loadFailed")}</h2>
          <p>{query.error.message}</p>
          <Button onClick={() => void query.refetch()}>{t("devices.retry")}</Button>
          <Button variant="ghost" onClick={login}>
            {t("devices.relogin")}
          </Button>
        </div>
      ) : query.data?.devices.length ? (
        <>
          {query.isError && (
            <p role="alert" className="mb-4 text-sm text-destructive">
              {t("devices.refreshFailed")}
            </p>
          )}
          <LoginDevicesContent key={query.scope} snapshot={query.data} scope={query.scope} />
        </>
      ) : (
        <div className={pageStateClass}>
          <h2 className={pageStateTitleClass}>{t("devices.emptyList")}</h2>
          <p>{t("devices.emptyListHint")}</p>
        </div>
      )}
    </div>
  );
}
