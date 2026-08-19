import type { ReactNode } from "react";
import { DocsLayout } from "fumadocs-ui/layouts/docs";

import { SidebarGitHubLink } from "@/components/layout/sidebar-github-link";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";

export default function DocsRootLayout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      {...baseOptions()}
      sidebar={{ banner: <SidebarGitHubLink /> }}
      tree={source.getPageTree()}
    >
      {children}
    </DocsLayout>
  );
}
