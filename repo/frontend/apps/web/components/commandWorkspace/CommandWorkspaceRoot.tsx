"use client";

import { CommandWorkspaceRootList } from "@/components/commandWorkspace/CommandWorkspaceRootList";
import { CommandWorkspaceRootFooter } from "@/components/commandWorkspace/CommandWorkspaceRootFooter";
import { CommandWorkspaceRootInput } from "@/components/commandWorkspace/CommandWorkspaceRootInput";
import { useCommandWorkspaceRoot } from "@/hooks/commandWorkspace/useCommandWorkspaceRoot";
import type { CommandWorkspaceRootProps } from "@/types/commandWorkspace";

export function CommandWorkspaceRoot(props: CommandWorkspaceRootProps) {
  const model = useCommandWorkspaceRoot(props);
  return (
    <>
      <CommandWorkspaceRootInput
        inputRef={model.inputRef}
        onChange={model.onQueryChange}
        onKeyDown={model.handleKeyDown}
        query={model.query}
      />
      <div className="mx-5 h-px bg-white/8" />
      <CommandWorkspaceRootList
        items={model.items}
        selectedIndex={model.selectedIndex}
        onSelect={model.onSelect}
      />
      <CommandWorkspaceRootFooter />
    </>
  );
}
