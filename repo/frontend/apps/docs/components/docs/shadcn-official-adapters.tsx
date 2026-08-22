"use client";

import type { ComponentProps } from "react";

import officialExamples from "@/components/docs/shadcn-official-examples.json";
import localSources from "@/components/docs/shadcn-component-sources.json";
import { ShadcnExample } from "@/components/docs/shadcn-example";
import type { ShadcnPreviewName } from "@/types/component-docs";

const previewNameMap: Record<string, ShadcnPreviewName> = {
  accordion: "shadcn-accordion",
  alert: "shadcn-alert",
  "alert-dialog": "shadcn-alert-dialog",
  "aspect-ratio": "shadcn-aspect-ratio",
  attachment: "shadcn-attachment",
  avatar: "shadcn-avatar",
  badge: "shadcn-badge",
  breadcrumb: "shadcn-breadcrumb",
  bubble: "shadcn-bubble",
  "button-group": "shadcn-button-group",
  calendar: "shadcn-calendar",
  card: "shadcn-card",
  carousel: "shadcn-carousel",
  chart: "shadcn-chart",
  checkbox: "shadcn-checkbox",
  collapsible: "shadcn-collapsible",
  combobox: "shadcn-combobox",
  command: "shadcn-command",
  "context-menu": "shadcn-context-menu",
  dialog: "shadcn-dialog",
  direction: "shadcn-direction",
  drawer: "shadcn-drawer",
  "dropdown-menu": "shadcn-dropdown-menu",
  empty: "shadcn-empty",
  field: "shadcn-field",
  form: "shadcn-form",
  "hover-card": "shadcn-hover-card",
  input: "shadcn-input",
  "input-group": "shadcn-input-group",
  "input-otp": "shadcn-input-otp",
  item: "shadcn-item",
  kbd: "shadcn-kbd",
  label: "shadcn-label",
  marker: "shadcn-marker",
  menubar: "shadcn-menubar",
  message: "shadcn-message",
  "message-scroller": "shadcn-message-scroller",
  "native-select": "shadcn-native-select",
  "navigation-menu": "shadcn-navigation-menu",
  pagination: "shadcn-pagination",
  popover: "shadcn-popover",
  progress: "shadcn-progress",
  "radio-group": "shadcn-radio-group",
  resizable: "shadcn-resizable",
  "scroll-area": "shadcn-scroll-area",
  select: "shadcn-select",
  separator: "shadcn-separator",
  sheet: "shadcn-sheet",
  sidebar: "shadcn-sidebar",
  skeleton: "shadcn-skeleton",
  slider: "shadcn-slider",
  sonner: "shadcn-sonner",
  spinner: "shadcn-spinner",
  switch: "shadcn-switch",
  table: "shadcn-table",
  tabs: "shadcn-tabs",
  textarea: "shadcn-textarea",
  toggle: "shadcn-toggle",
  "toggle-group": "shadcn-toggle-group",
  tooltip: "shadcn-tooltip",
};

type ReferenceMap = Record<string, string>;

function getComponentSlug(name: string): string {
  if (name.startsWith("shadcn-")) return name.slice("shadcn-".length);
  if (previewNameMap[name]) return name;
  return Object.keys(previewNameMap).find((slug) => name.startsWith(`${slug}-`)) ?? name;
}

function getPreviewName(name: string): ShadcnPreviewName {
  if (name.startsWith("shadcn-")) return name as ShadcnPreviewName;
  return (
    previewNameMap[getComponentSlug(name)] ??
    (`shadcn-${getComponentSlug(name)}` as ShadcnPreviewName)
  );
}

function getExampleCode(name: string, slug: string): string {
  const examples = officialExamples as ReferenceMap;
  return examples[name] ?? examples[`${slug}-demo`] ?? `// ${slug} example`;
}

export function ShadcnOfficialPreview({
  align = "center",
  className,
  direction = "ltr",
  hideCode = false,
  name,
  previewClassName,
  ...props
}: ComponentProps<"div"> & {
  name: string;
  align?: "center" | "start" | "end";
  direction?: "ltr" | "rtl";
  hideCode?: boolean;
  previewClassName?: string;
  styleName?: string;
  type?: "block" | "component" | "example";
}) {
  const slug = getComponentSlug(name);
  const previewName = getPreviewName(name);
  return (
    <ShadcnExample
      {...props}
      className={className}
      align={align}
      code={getExampleCode(name, slug)}
      direction={direction}
      hideCode={hideCode}
      name={previewName}
      previewClassName={previewClassName}
    />
  );
}

export function ShadcnComponentSource({
  className,
  name,
  title,
  ...props
}: ComponentProps<"div"> & { name?: string; title?: string }) {
  const sourcePath =
    title?.replace(/^components\/ui\//, "").replace(/\.tsx$/, "") ?? name ?? "component";
  const sources = localSources as ReferenceMap;
  const source = sources[sourcePath] ?? "// Source is maintained in packages/ui/shadcn/components.";
  return (
    <ShadcnExample
      {...props}
      className={className}
      code={`// ${sourcePath}.tsx\n\n${source}`}
      hideCode
    >
      <p className="text-muted-foreground text-sm">
        当前实现位于 <code>{sourcePath}.tsx</code>，请以 Scopify UI 包中的源码为准。
      </p>
    </ShadcnExample>
  );
}
