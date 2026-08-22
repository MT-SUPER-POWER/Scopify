import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

import { DocsBrand } from "@/components/layout/docs-brand";

export function baseOptions(): BaseLayoutProps {
  return {
    githubUrl: "https://github.com/MT-SUPER-POWER/Scopify",
    nav: {
      title: <DocsBrand />,
    },
  };
}
