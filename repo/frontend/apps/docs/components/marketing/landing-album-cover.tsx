import { getImageProps } from "next/image";

import { LANDING_MAIN_SCREENSHOT } from "@/constants/marketing";
import type { LandingCoverCrop } from "@/types/marketing";

interface LandingAlbumCoverProps {
  className?: string;
  crop: LandingCoverCrop;
}

const { src: mainImage } = LANDING_MAIN_SCREENSHOT;
const {
  props: { src: optimizedMainUrl },
} = getImageProps({ alt: "", src: mainImage, width: 760 });

/** 从首页截图「为你推荐」里裁出一张真实专辑封面，避免额外引入版权素材。 */
export function LandingAlbumCover({ className = "", crop }: LandingAlbumCoverProps) {
  const backgroundSize = `${(mainImage.width / crop.size) * 100}% auto`;
  const x = (crop.x / (mainImage.width - crop.size)) * 100;
  const y = (crop.y / (mainImage.height - crop.size)) * 100;

  return (
    <span
      aria-hidden="true"
      className={`block bg-white/6 bg-no-repeat ${className}`}
      style={{
        backgroundImage: `url(${optimizedMainUrl})`,
        backgroundPosition: `${x}% ${y}%`,
        backgroundSize,
      }}
    />
  );
}
