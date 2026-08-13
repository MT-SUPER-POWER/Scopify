import { ChevronRight } from "lucide-react";
import React, { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface CollapsibleLibraryGroupProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleLibraryGroup({
  title,
  children,
  defaultOpen = true,
}: CollapsibleLibraryGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // 如果没有子元素，直接不渲染
  if (!children || React.Children.count(children) === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-1">
      <CollapsibleTrigger asChild>
        <button className="text-content-muted group hover:text-content flex w-full cursor-pointer items-center px-2 py-1 transition-colors outline-none select-none">
          <div className={cn("mr-1 transition-transform duration-200", isOpen && "rotate-90")}>
            <ChevronRight className="size-4" />
          </div>
          <span className="text-xs font-bold opacity-80">{title}</span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
