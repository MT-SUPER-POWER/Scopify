export function DesktopWallpaperSpikeStatus() {
  return (
    <aside
      data-desktop-wallpaper-spike-status
      className="pointer-events-none absolute right-10 bottom-9 rounded-2xl border border-white/15 bg-black/30 px-5 py-4 font-mono text-[11px] tracking-[0.18em] text-white/65 shadow-2xl backdrop-blur-xl select-none"
    >
      <p className="mb-2 text-xs font-semibold text-white/90">SCOPIFY DESKTOP HOST SPIKE</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt>RENDERER</dt>
        <dd className="text-cyan-200/80">REQUESTANIMATIONFRAME</dd>
        <dt>INPUT</dt>
        <dd>DISABLED</dd>
        <dt>EXIT</dt>
        <dd>CTRL+C</dd>
      </dl>
    </aside>
  );
}
