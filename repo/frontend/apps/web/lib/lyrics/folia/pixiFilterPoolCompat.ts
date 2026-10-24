import type { BindGroup, Texture } from "pixi.js";

// Folia `src/components/visualizer/pixi/pixiFilterPoolCompat.ts` (v0.7.22), widened to 8.22.0.
// Pixi 8.21.0 prunes screen-sized textures while FilterSystem still references the last pass:
// its bind group keeps the texture bound, and a reused filter stack entry keeps it as input.
// The stack-entry fix shipped in 8.22.0 but the bind-group one landed after it, so the 8.22.0
// this app resolves still binds a destroyed texture when a window resize prunes a pool bucket
// under a nested filter (花火's screen bloom over its firework glow). On 8.22.0 the push() patch
// below is a no-op guard; the bind-group half is what still matters.
// Remove this version-gated shim once the dependency includes both upstream fixes:
// https://github.com/pixijs/pixijs/pull/12259 (bind group, after 8.22.0)
// https://github.com/pixijs/pixijs/pull/12257 (stack entry, in 8.22.0)
type PixiModule = typeof import("pixi.js");
const PATCHED = Symbol.for("folia.pixi821FilterPoolCompat");
/** The releases that still bind a pruned texture: 8.21.0 both ways, 8.22.0 through the bind group. */
const AFFECTED_VERSIONS = new Set(["8.21.0", "8.22.0"]);

interface FilterSystemCompat {
  _globalFilterBindGroup: BindGroup;
  _filterStack: { inputTexture: Texture | null }[];
  _filterStackIndex: number;
  init?: () => void;
  push: (instruction: unknown) => void;
  destroy: () => void;
  [PATCHED]?: boolean;
}

interface TexturePoolCompat {
  _poolKey: Record<number, number | undefined>;
  _buckets: Map<number, Texture[]>;
  _dropTextures: (textures: Texture[], destroy: boolean) => void;
  returnTexture: (texture: Texture, resetStyle?: boolean) => void;
}

/** Unbind all live renderers before the shared pool destroys textures; keep normal draws unchanged. */
export const installPixiFilterPoolCompat = (pixi: PixiModule) => {
  if (!AFFECTED_VERSIONS.has(pixi.VERSION as string)) return;
  const prototype = pixi.FilterSystem.prototype as unknown as FilterSystemCompat;
  if (prototype[PATCHED]) return;
  prototype[PATCHED] = true;

  const groups = new Set<BindGroup>();
  const pool = pixi.TexturePool as unknown as TexturePoolCompat;
  const unbindPassTextures = () => {
    const source = pixi.Texture.EMPTY.source;
    groups.forEach((group) => {
      group.setResource(source, 1);
      group.setResource(source.style, 2);
      group.setResource(source, 3);
    });
  };

  // init is picked up by Pixi's renderer runner before any filter is rendered.
  const init = prototype.init;
  prototype.init = function () {
    init?.call(this);
    groups.add(this._globalFilterBindGroup);
  };
  const destroy = prototype.destroy;
  prototype.destroy = function () {
    groups.delete(this._globalFilterBindGroup);
    this._globalFilterBindGroup.destroy();
    destroy.call(this);
  };
  // push() claims its stack entry before looking up the enclosing filter's resolution, so for a
  // nested filter the lookup reads that entry's input from an earlier frame - already returned,
  // and destroyed if a resize pruned its bucket since. The value only feeds a global frame
  // nothing reads; clearing the stale input makes the lookup fall back to the root resolution.
  const push = prototype.push;
  prototype.push = function (instruction) {
    const entry = this._filterStack[this._filterStackIndex];
    if (entry) entry.inputTexture = null;
    push.call(this, instruction);
  };

  // Resize, renderer destruction and clear() all discard idle textures through this method.
  const dropTextures = pool._dropTextures;
  pool._dropTextures = function (textures, shouldDestroy) {
    if (shouldDestroy && textures.length > 0) unbindPassTextures();
    dropTextures.call(this, textures, shouldDestroy);
  };
  // A checked-out texture can outlive its bucket and be destroyed directly on return.
  const returnTexture = pool.returnTexture;
  pool.returnTexture = function (texture, resetStyle) {
    const key = this._poolKey[texture.uid];
    if (key !== undefined && !this._buckets.has(key)) unbindPassTextures();
    returnTexture.call(this, texture, resetStyle);
  };
};
