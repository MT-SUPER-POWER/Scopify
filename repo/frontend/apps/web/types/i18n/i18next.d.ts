import "i18next";
import type Resources from "./resources.generated";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: Resources;
    keySeparator: false;
    nsSeparator: false;
    enableSelector: "optimize";
  }
}
