import { useState, useRef, useEffect } from "react";
import {
  pushMonetPortraitLayer,
  settleMonetPortraitLayers,
} from "../../lib/lyrics/folia/monetPortraitCrossfade";
import type { MonetPortraitLayer } from "../../types/lyrics/folia/monetPortrait";

/** Decode the next cover before stacking it; release covered layers after the fade. */
export function useMonetPortraitCrossfade(src: string | null | undefined, fadeMs: number) {
  const [layers, setLayers] = useState<MonetPortraitLayer[]>([]);
  const layerKeyRef = useRef(0);

  useEffect(() => {
    if (!src) {
      return undefined;
    }
    let cancelled = false;
    const stack = () => {
      if (cancelled) return;
      layerKeyRef.current += 1;
      const key = `monet-portrait-${layerKeyRef.current}`;
      setLayers((current) => pushMonetPortraitLayer(current, src, key));
    };

    // Decoded on a detached element so the frame keeps showing the old cover until this one can
    // be painted whole. The rendered <img> below then hits the same decoded entry.
    const loader = new Image();
    loader.decoding = "async";
    loader.src = src;
    if (typeof loader.decode === "function") {
      // A rejection is a cover that cannot be shown - a dead blob URL, a 404, a truncated
      // body. Swallowed on purpose: the stack is left as it is, which keeps the cover that is
      // already on screen rather than fading to an empty frame.
      loader.decode().then(stack, () => {});
    } else {
      loader.onload = stack;
    }

    return () => {
      cancelled = true;
    };
  }, [src]);

  // Armed against the top layer only. A cover that arrives mid-fade pushes a new top and re-arms
  // this, so the whole stack is dropped in one go once that last cover is opaque - no layer is
  // ever removed while something below it is still visible through it.
  const settlingKey = layers.length > 1 ? layers[layers.length - 1].key : null;
  useEffect(() => {
    if (!settlingKey) {
      return undefined;
    }
    const timer = window.setTimeout(
      () => setLayers((current) => settleMonetPortraitLayers(current, settlingKey)),
      fadeMs,
    );
    return () => window.clearTimeout(timer);
  }, [fadeMs, settlingKey]);

  // A song with no cover at all fades the stack out and keeps it, so the next cover has something
  // to fade in over instead of appearing against the bare frame.
  const targetOpacity = src ? 1 : 0;

  return { layers, targetOpacity };
}
