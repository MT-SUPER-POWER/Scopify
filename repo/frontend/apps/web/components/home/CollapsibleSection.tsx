"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";

import { useSectionCollapse } from "@/hooks/home/useSectionCollapse";
import type { CollapsibleSectionProps } from "@/types/components/home";

export function CollapsibleSection({
  title,
  children,
  action,
  defaultOpen = false,
  open,
  onOpenChange,
  collapsedHeight = "180px",
  collapsedRows,
  disableHeightCollapse = false,
  showTrigger,
}: CollapsibleSectionProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;
  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };
  const { contentRef, hasCollapsedOverflow, height } = useSectionCollapse(
    collapsedHeight,
    collapsedRows,
    isOpen,
    disableHeightCollapse,
  );
  const { t } = useI18n();
  const isTriggerVisible = showTrigger ?? (isOpen || hasCollapsedOverflow);

  return (
    <Collapsible open={isOpen} onOpenChange={handleOpenChange} className="space-y-4">
      <div className="group/section flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="min-w-0">{title}</div>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          {action}
          {isTriggerVisible ? (
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex cursor-pointer items-center gap-1 text-xs font-medium text-content-muted transition-colors outline-none hover:text-content hover:underline"
              >
                {isOpen ? t("common.action.showLess") : t("common.action.showAll")}
                <ChevronRight
                  className={cn(
                    "size-4 transition-transform duration-200",
                    isOpen ? "-rotate-90" : "rotate-90",
                  )}
                />
              </button>
            </CollapsibleTrigger>
          ) : null}
        </div>
      </div>
      {disableHeightCollapse ? (
        <div>{children}</div>
      ) : (
        <div className="relative overflow-hidden">
          <motion.div
            initial={false}
            animate={{ height: isOpen || !hasCollapsedOverflow ? "auto" : height }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="relative"
          >
            <div ref={contentRef}>{children}</div>
            <AnimatePresence>
              {!isOpen && hasCollapsedOverflow && !collapsedRows && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-linear-to-t from-surface-raised via-surface-raised/80 to-transparent"
                />
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </Collapsible>
  );
}
