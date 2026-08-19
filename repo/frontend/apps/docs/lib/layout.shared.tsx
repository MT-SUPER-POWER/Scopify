import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

import { DocsBrand } from "@/components/layout/docs-brand";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <DocsBrand />,
    },
  };
}
