import "i18next";
import type Resources from "./resources.generated";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: readonly (keyof Resources)[];
    resources: Resources;
    keySeparator: false;
    nsSeparator: ".";
  }
}
