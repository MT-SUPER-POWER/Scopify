export function CommandWorkspaceRootFooter() {
  return (
    <footer className="flex items-center gap-2 border-t border-white/10 bg-black/20 px-5 py-3 text-xs text-zinc-400">
      <kbd className="rounded border border-white/15 bg-white/8 px-1.5 py-0.5 text-zinc-200">?</kbd>{" "}
      查看当前页操作<span className="ml-auto">Esc 返回</span>
    </footer>
  );
}
