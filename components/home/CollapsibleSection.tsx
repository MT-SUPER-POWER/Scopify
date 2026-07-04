"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";

interface CollapsibleSectionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  defaultOpen?: boolean;
  collapsedHeight?: string;
}

export function CollapsibleSection({
  title,
  children,
  action,
  defaultOpen = false,
  collapsedHeight = "180px",
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { t } = useI18n();

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-4">
      <div className="group/section flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="cursor-pointer">{title}</div>
        </div>
        <div className="flex items-center gap-4">
          {action}
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex cursor-pointer items-center gap-1 text-sm font-bold text-zinc-400 transition-colors outline-none hover:text-white hover:underline"
            >
              {isOpen ? t("common.action.showLess") : t("common.action.showAll")}
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isOpen ? "-rotate-90" : "rotate-90",
                )}
              />
            </button>
          </CollapsibleTrigger>
        </div>
      </div>
      <div className="relative overflow-hidden">
        <motion.div
          initial={false}
          animate={{ height: isOpen ? "auto" : collapsedHeight }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="relative"
        >
          {children}
          <AnimatePresence>
            {!isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-12 bg-linear-to-t from-[#121212] via-[#121212]/80 to-transparent"
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </Collapsible>
  );
}
