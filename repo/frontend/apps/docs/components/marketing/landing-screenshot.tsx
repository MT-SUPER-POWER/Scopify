import Image, { type StaticImageData } from "next/image";

interface LandingScreenshotProps {
  alt: string;
  image: StaticImageData;
  priority?: boolean;
}

export function LandingScreenshot({ alt, image, priority = false }: LandingScreenshotProps) {
  return (
    <div className="relative overflow-hidden rounded-[18px] border border-white/12 bg-black/28 shadow-[0_48px_140px_rgba(0,0,0,0.58)] backdrop-blur-sm">
      <Image
        src={image}
        alt={alt}
        className="h-auto w-full"
        placeholder="blur"
        priority={priority}
        sizes="(max-width: 768px) 94vw, 88vw"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_24%,transparent_75%,rgba(153,176,229,0.08))]" />
    </div>
  );
}
