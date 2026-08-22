import type { TranslateFn } from "@/types/folia-i18n";

const FOLIA_LANDING_MESSAGES: Record<string, string> = {
  "folia.ui.backToHome": "返回",
  "folia.ui.waitingForMusic": "让声音，显形。",
};

const translate: TranslateFn = (key) => FOLIA_LANDING_MESSAGES[key] ?? key;

export const useI18n = () => ({ t: translate });
