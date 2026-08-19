export type ShadcnPreviewName =
  "shadcn-badge" | "shadcn-button" | "shadcn-skeleton" | "shadcn-slider" | "shadcn-tooltip";

export type ComponentPreviewName = ShadcnPreviewName;

export interface ComponentPreviewProps {
  name: ComponentPreviewName;
}
