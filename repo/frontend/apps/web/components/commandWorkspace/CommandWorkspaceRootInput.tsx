import { Command } from "lucide-react";
import type { KeyboardEvent, RefObject } from "react";

interface CommandWorkspaceRootInputProps {
  inputRef: RefObject<HTMLInputElement | null>;
  onChange(query: string): void;
  onKeyDown(event: KeyboardEvent<HTMLInputElement>): void;
  query: string;
}

export function CommandWorkspaceRootInput({
  inputRef,
  onChange,
  onKeyDown,
  query,
}: CommandWorkspaceRootInputProps) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <Command className="size-5 shrink-0 text-zinc-400" />
      <span className="text-base font-medium text-zinc-400">&gt;</span>
      <input
        ref={inputRef}
        autoFocus
        value={query}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="搜索命令"
        className="min-w-0 flex-1 border-none bg-transparent text-base font-medium text-white outline-none placeholder:text-white/40"
      />
    </div>
  );
}
