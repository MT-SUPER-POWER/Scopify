"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";

interface CollapsibleSectionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  collapsedHeight?: string;
}

export function CollapsibleSection({
  title,
  children,
  action,
  defaultOpen = false,
  open,
  onOpenChange,
  collapsedHeight = "180px",
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
  const [hasCollapsedOverflow, setHasCollapsedOverflow] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  useLayoutEffect(() => {
    const content = contentRef.current;
    const match = collapsedHeight.trim().match(/^(\d+(?:\.\d+)?)px$/);
    if (!content || !match) return;

    const collapsedHeightPx = Number(match[1]);
    const updateOverflow = () => {
      setHasCollapsedOverflow(content.getBoundingClientRect().height > collapsedHeightPx + 0.5);
    };

    updateOverflow();
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(content);
    return () => observer.disconnect();
  }, [collapsedHeight]);

  return (
    <Collapsible open={isOpen} onOpenChange={handleOpenChange} className="space-y-6">
      <div className="group/section flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="cursor-pointer">{title}</div>
        </div>
        <div className="flex items-center gap-4">
          {action}
          {hasCollapsedOverflow ? (
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="text-content-muted hover:text-content flex cursor-pointer items-center gap-1 text-sm font-bold transition-colors outline-none hover:underline"
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
      <div className="relative overflow-hidden">
        <motion.div
          initial={false}
          animate={{ height: isOpen || !hasCollapsedOverflow ? "auto" : collapsedHeight }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="relative"
        >
          <div ref={contentRef}>{children}</div>
          <AnimatePresence>
            {!isOpen && hasCollapsedOverflow && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="from-surface-raised via-surface-raised/80 pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-linear-to-t to-transparent"
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </Collapsible>
  );
}
