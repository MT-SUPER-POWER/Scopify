const SANDBOXED_PRELOAD_REQUIRE_ALLOWLIST = new Set(["electron", "events", "timers", "url"]);
const LITERAL_REQUIRE_PATTERN = /\brequire\(\s*["']([^"']+)["']\s*\)/g;

/**
 * Electron's sandboxed preload loader exposes only a narrow `require` allowlist.
 * Every application dependency must therefore be bundled into the preload entry.
 */
export function verifySandboxedPreloadBundleSource(source: string) {
  for (const match of source.matchAll(LITERAL_REQUIRE_PATTERN)) {
    const specifier = match[1];
    if (SANDBOXED_PRELOAD_REQUIRE_ALLOWLIST.has(specifier)) continue;
    return {
      message: `Sandbox preload bundle requires unsupported module "${specifier}".`,
      ok: false as const,
    };
  }

  return { ok: true as const };
}
