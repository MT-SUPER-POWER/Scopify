import type { MDXComponents } from "mdx/types";
import defaultMdxComponents from "fumadocs-ui/mdx";

import { ComponentPreview } from "@/components/docs/component-preview";
import {
  ShadcnComponentSource,
  ShadcnOfficialPreview,
} from "@/components/docs/shadcn-official-adapters";
import {
  CodeTabs,
  Step,
  Steps,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/docs/shadcn-official-layout";
import { ShadcnButtonExample } from "@/components/docs/previews/shadcn-button-examples";
import { ShadcnCodeExample } from "@/components/docs/shadcn-code-example";
import { ShadcnComponentExample } from "@/components/docs/shadcn-component-example";
import { ShadcnExample } from "@/components/docs/shadcn-example";
import { Mermaid } from "@/components/mdx/mermaid";
import { ThemeWorkbench } from "@/components/theme-lab/theme-workbench";

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    CodeTabs,
    ComponentPreview,
    Mermaid,
    ShadcnButtonExample,
    ShadcnCodeExample,
    ShadcnComponentExample,
    ShadcnComponentSource,
    ShadcnOfficialPreview,
    ShadcnExample,
    Step,
    Steps,
    TabsContent,
    TabsList,
    TabsTrigger,
    ThemeWorkbench,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
