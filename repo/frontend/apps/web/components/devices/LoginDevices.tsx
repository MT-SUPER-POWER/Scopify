"use client";
import { useLoginDevices } from "@/hooks/devices/useLoginDevices";
import { useI18n } from "@/store/module/i18n";
import { Button } from "@scopify/ui/shadcn/components/button";
import { openLoginWindowOrFallback } from "@/lib/runtime/login";
import { runtime } from "@/lib/runtime";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { LoginDevicesHeader } from "./LoginDevicesHeader";
import { LoginDevicesContent } from "./LoginDevicesContent";
import styles from "./LoginDevices.module.css";
export function LoginDevices() {
  const query = useLoginDevices();
  const { t } = useI18n();
  const router = useSmartRouter();
  const login = () =>
    openLoginWindowOrFallback(runtime.auth, () => router.push("/login?redirect=/setting/devices"));
  return (
    <div className={styles.page}>
      <LoginDevicesHeader
        allowance={query.data?.allowance ?? null}
        refreshing={query.isFetching}
        onRefresh={() => void query.refetch()}
        authenticated={query.authenticated}
      />
      {!query.authenticated ? (
        <div className={styles.pageState}>
          <h2>{t("devices.loginRequired")}</h2>
          <Button onClick={login}>{t("devices.loginAction")}</Button>
        </div>
      ) : query.isPending ? (
        <div className={styles.pageState} role="status" aria-live="polite">
          <div className={styles.loadingStage} />
          <p>{t("devices.loading")}</p>
        </div>
      ) : query.isError && !query.data ? (
        <div className={styles.pageState} role="alert">
          <h2>{t("devices.loadFailed")}</h2>
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
        <div className={styles.pageState}>
          <h2>{t("devices.emptyList")}</h2>
          <p>{t("devices.emptyListHint")}</p>
        </div>
      )}
    </div>
  );
}
