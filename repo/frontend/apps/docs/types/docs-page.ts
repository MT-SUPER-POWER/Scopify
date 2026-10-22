import type { ComponentProps } from "react";
import type { MDXContent } from "mdx/types";
import type { DocsPage } from "fumadocs-ui/layouts/docs/page";

export interface DocsRouteProps {
  params: Promise<{ slug?: string[] }>;
}

export interface CompiledDocsData {
  body: MDXContent;
  full?: boolean;
  toc: NonNullable<ComponentProps<typeof DocsPage>["toc"]>;
}
