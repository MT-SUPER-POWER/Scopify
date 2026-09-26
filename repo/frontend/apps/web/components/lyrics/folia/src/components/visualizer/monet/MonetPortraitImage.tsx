import type React from "react";
import { motion } from "framer-motion";
import { useMonetPortraitCrossfade } from "../../../../../../../hooks/lyrics/useMonetPortraitCrossfade";
import { MONET_PORTRAIT_FADE_MS } from "../../../../../../../lib/lyrics/folia/monetPortraitCrossfade";
import type { MonetPortraitImageProps } from "../../../../../../../types/lyrics/folia/monetPortrait";

const MonetPortraitImage: React.FC<MonetPortraitImageProps> = ({
  src,
  fadeMs = MONET_PORTRAIT_FADE_MS,
}) => {
  const { layers, targetOpacity } = useMonetPortraitCrossfade(src, fadeMs);
  return (
    <div className="relative size-full">
      {layers.map((layer) => (
        <motion.img
          key={layer.key}
          src={layer.src}
          initial={{ opacity: 0 }}
          animate={{ opacity: targetOpacity }}
          transition={{ duration: fadeMs / 1000, ease: "easeInOut" }}
          decoding="async"
          alt=""
          className="absolute inset-0 size-full object-cover"
          draggable={false}
          data-monet-portrait-image
        />
      ))}
    </div>
  );
};

export default MonetPortraitImage;
