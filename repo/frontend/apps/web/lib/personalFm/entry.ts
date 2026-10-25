import { toast } from "sonner";
import { translate } from "@/lib/i18n";
import { useI18nStore } from "@/store/module/i18n";
import { usePersonalFmStore } from "@/store/module/personalFm";

/** Reuse the current list; only an empty session needs a request before navigation. */
export async function ensurePersonalFmOnEntry(shouldReportError: () => boolean = () => true) {
  const ready = await usePersonalFmStore.getState().ensureReady();
  if (!ready && shouldReportError()) {
    toast.error(
      usePersonalFmStore.getState().error ??
        translate(useI18nStore.getState().locale, "personalFm.error.loadFailed"),
    );
  }
  return ready;
}
