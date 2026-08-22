"use client";

import { ShadcnBasicActionPreview } from "@/components/docs/previews/shadcn-basic-action-preview";
import { ShadcnBasicContentPreview } from "@/components/docs/previews/shadcn-basic-content-preview";
import { ShadcnConversationPreview } from "@/components/docs/previews/shadcn-conversation-preview";
import { ShadcnDataRichPreview } from "@/components/docs/previews/shadcn-data-rich-preview";
import { ShadcnDataStructurePreview } from "@/components/docs/previews/shadcn-data-structure-preview";
import { ShadcnFeedbackPreview } from "@/components/docs/previews/shadcn-feedback-preview";
import { ShadcnFormControlPreview } from "@/components/docs/previews/shadcn-form-control-preview";
import { ShadcnFormFieldPreview } from "@/components/docs/previews/shadcn-form-field-preview";
import { ShadcnFormInputPreview } from "@/components/docs/previews/shadcn-form-input-preview";
import { ShadcnFormSelectionPreview } from "@/components/docs/previews/shadcn-form-selection-preview";
import { ShadcnMessageScrollerPreview } from "@/components/docs/previews/shadcn-message-scroller-preview";
import { ShadcnNavigationMenuPreview } from "@/components/docs/previews/shadcn-navigation-menu-preview";
import { ShadcnNavigationPathPreview } from "@/components/docs/previews/shadcn-navigation-path-preview";
import { ShadcnOverlayDialogPreview } from "@/components/docs/previews/shadcn-overlay-dialog-preview";
import { ShadcnOverlayFlyoutPreview } from "@/components/docs/previews/shadcn-overlay-flyout-preview";
import { ShadcnOverlayMenuPreview } from "@/components/docs/previews/shadcn-overlay-menu-preview";
import { ShadcnSidebarPreview } from "@/components/docs/previews/shadcn-sidebar-preview";
import type { ShadcnPreviewProps } from "@/types/component-docs";

export function ShadcnPreview({ name }: ShadcnPreviewProps) {
  switch (name) {
    case "shadcn-badge":
    case "shadcn-button":
    case "shadcn-button-group":
    case "shadcn-kbd":
      return <ShadcnBasicActionPreview name={name} />;
    case "shadcn-avatar":
    case "shadcn-card":
    case "shadcn-direction":
    case "shadcn-empty":
    case "shadcn-item":
    case "shadcn-separator":
      return <ShadcnBasicContentPreview name={name} />;
    case "shadcn-input":
    case "shadcn-input-group":
    case "shadcn-input-otp":
    case "shadcn-label":
    case "shadcn-textarea":
      return <ShadcnFormInputPreview name={name} />;
    case "shadcn-checkbox":
    case "shadcn-combobox":
    case "shadcn-native-select":
    case "shadcn-radio-group":
    case "shadcn-select":
      return <ShadcnFormSelectionPreview name={name} />;
    case "shadcn-field":
    case "shadcn-form":
      return <ShadcnFormFieldPreview name={name} />;
    case "shadcn-calendar":
    case "shadcn-slider":
    case "shadcn-switch":
    case "shadcn-toggle":
    case "shadcn-toggle-group":
      return <ShadcnFormControlPreview name={name} />;
    case "shadcn-accordion":
    case "shadcn-aspect-ratio":
    case "shadcn-carousel":
    case "shadcn-collapsible":
      return <ShadcnDataStructurePreview name={name} />;
    case "shadcn-chart":
    case "shadcn-resizable":
    case "shadcn-scroll-area":
    case "shadcn-table":
      return <ShadcnDataRichPreview name={name} />;
    case "shadcn-alert":
    case "shadcn-progress":
    case "shadcn-skeleton":
    case "shadcn-sonner":
    case "shadcn-spinner":
      return <ShadcnFeedbackPreview name={name} />;
    case "shadcn-breadcrumb":
    case "shadcn-pagination":
    case "shadcn-tabs":
      return <ShadcnNavigationPathPreview name={name} />;
    case "shadcn-menubar":
    case "shadcn-navigation-menu":
      return <ShadcnNavigationMenuPreview name={name} />;
    case "shadcn-sidebar":
      return <ShadcnSidebarPreview name={name} />;
    case "shadcn-alert-dialog":
    case "shadcn-dialog":
    case "shadcn-drawer":
    case "shadcn-sheet":
      return <ShadcnOverlayDialogPreview name={name} />;
    case "shadcn-command":
    case "shadcn-context-menu":
    case "shadcn-dropdown-menu":
      return <ShadcnOverlayMenuPreview name={name} />;
    case "shadcn-hover-card":
    case "shadcn-popover":
    case "shadcn-tooltip":
      return <ShadcnOverlayFlyoutPreview name={name} />;
    case "shadcn-attachment":
    case "shadcn-bubble":
    case "shadcn-marker":
    case "shadcn-message":
      return <ShadcnConversationPreview name={name} />;
    case "shadcn-message-scroller":
      return <ShadcnMessageScrollerPreview name={name} />;
  }
}
