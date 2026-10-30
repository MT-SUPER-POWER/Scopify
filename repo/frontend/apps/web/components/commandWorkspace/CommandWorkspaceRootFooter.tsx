export function CommandWorkspaceRootFooter() {
  return (
    <footer className="flex items-center gap-2 border-t border-border bg-content/3 px-5 py-3 text-xs text-content-muted">
      <kbd className="rounded border border-border bg-content/8 px-1.5 py-0.5 text-content">?</kbd>{" "}
      查看当前页操作<span className="ml-auto">Esc 返回</span>
    </footer>
  );
}
