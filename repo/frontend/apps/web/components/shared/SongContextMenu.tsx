"use client";

import { useState } from "react";
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import { SongContextMenuActions } from "@/components/shared/SongContextMenuActions";
import type { SongContextMenuProps } from "@/types/components/songContextMenu";

export function SongContextMenu({ children, onOpenContextMenu, ...props }: SongContextMenuProps) {
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  return (
    <ContextMenu
      onOpenChange={(open) => {
        setIsContextMenuOpen(open);
        if (open) onOpenContextMenu?.();
      }}
    >
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      {(isContextMenuOpen || isCreateDialogOpen) && (
        <SongContextMenuActions
          {...props}
          isContextMenuOpen={isContextMenuOpen}
          isCreateDialogOpen={isCreateDialogOpen}
          setIsCreateDialogOpen={setIsCreateDialogOpen}
        />
      )}
    </ContextMenu>
  );
}
