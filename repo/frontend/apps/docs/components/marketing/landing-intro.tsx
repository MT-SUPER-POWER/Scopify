import type { RefObject } from "react";
import Image from "next/image";

import scopifyLogo from "@/assets/logo.png";

interface LandingIntroProps {
  sectionRef: RefObject<HTMLElement | null>;
}

export function LandingIntro({ sectionRef }: LandingIntroProps) {
  return (
    <section ref={sectionRef} aria-label="让声音，显形。" className="relative min-h-svh px-6">
      <div className="absolute top-8 right-7 flex items-center gap-3 sm:top-10 sm:right-10">
        <Image src={scopifyLogo} alt="" className="size-8 rounded-lg" priority />
        <span className="text-sm font-medium tracking-[0.04em] text-white/72">Scopify</span>
      </div>
      <h1 className="sr-only">让声音，显形。</h1>
    </section>
  );
}
