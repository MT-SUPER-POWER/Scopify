import type { ReactNode } from "react";
import { DocsLayout } from "fumadocs-ui/layouts/docs";

import { ThemePrototypeSwitcher } from "@/components/theme-prototype/theme-prototype-switcher";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";

export default function DocsRootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DocsLayout {...baseOptions()} tree={source.getPageTree()}>
        {children}
      </DocsLayout>
      <ThemePrototypeSwitcher />
    </>
  );
}
