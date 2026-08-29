import { useEffect, useState } from "react";

/** Invalidates measured text whenever a late or dynamically selected web font finishes loading. */
export const useFontsEpoch = (): number => {
  const [epoch, setEpoch] = useState(0);

  useEffect(() => {
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    if (!fonts) return;

    let mounted = true;
    let loadingDoneSeen = false;
    const bump = () => {
      if (mounted) setEpoch((value) => value + 1);
    };
    const handleLoadingDone = () => {
      loadingDoneSeen = true;
      bump();
    };

    fonts.addEventListener?.("loadingdone", handleLoadingDone);
    if (fonts.status !== "loaded") {
      fonts.ready
        ?.then(() => {
          if (!loadingDoneSeen) bump();
        })
        .catch(() => undefined);
    }

    return () => {
      mounted = false;
      fonts.removeEventListener?.("loadingdone", handleLoadingDone);
    };
  }, []);

  return epoch;
};
