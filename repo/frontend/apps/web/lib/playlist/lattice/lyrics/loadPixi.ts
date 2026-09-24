let pending: Promise<typeof import("pixi.js")> | null = null;
export const loadPixi = () =>
  (pending ??= import("pixi.js").catch((error) => {
    pending = null;
    throw error;
  }));
