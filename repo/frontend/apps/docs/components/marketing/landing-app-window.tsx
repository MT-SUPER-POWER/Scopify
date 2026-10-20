import Image from "next/image";

import type { LandingScreenshot } from "@/types/marketing";

interface LandingAppWindowProps {
  priority?: boolean;
  screenshot: LandingScreenshot;
  sizes: string;
}

/** 带玻璃高光与环境阴影的客户端窗口框，用来承载真实截图。 */
export function LandingAppWindow({ priority = false, screenshot, sizes }: LandingAppWindowProps) {
  return (
    <div className="relative rounded-[1.1rem] bg-linear-to-b from-white/18 via-white/6 to-white/3 p-px shadow-[0_60px_160px_-30px_rgba(0,0,0,0.85),0_30px_80px_-40px_rgba(99,227,166,0.25)]">
      <div className="relative overflow-hidden rounded-[calc(1.1rem-1px)] bg-black">
        <Image
          src={screenshot.src}
          alt={screenshot.alt}
          priority={priority}
          placeholder="blur"
          sizes={sizes}
          className="block h-auto w-full"
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/7 via-transparent to-transparent" />
      </div>
    </div>
  );
}
