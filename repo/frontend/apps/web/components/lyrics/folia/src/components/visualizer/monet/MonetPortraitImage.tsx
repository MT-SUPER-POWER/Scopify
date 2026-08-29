import type React from "react";

interface MonetPortraitImageProps {
  src?: string | null;
}

/** Replaces the image node when an asynchronously resolved Blob URL changes. */
const MonetPortraitImage: React.FC<MonetPortraitImageProps> = ({ src }) => (
  <img
    key={src || "empty"}
    src={src || undefined}
    decoding="async"
    alt=""
    className="size-full object-cover"
    style={{ opacity: src ? 1 : 0, transition: "opacity 1s ease" }}
    draggable={false}
    data-monet-portrait-image
  />
);

export default MonetPortraitImage;
