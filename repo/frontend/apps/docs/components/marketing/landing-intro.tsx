import type { RefObject } from "react";
import Image from "next/image";

import scopifyLogo from "@/assets/logo.png";

interface LandingIntroProps {
  sectionRef: RefObject<HTMLElement | null>;
}

export function LandingIntro({ sectionRef }: LandingIntroProps) {
  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-svh items-end justify-center px-6 pb-[16svh]"
    >
      <div className="absolute top-8 right-7 flex items-center gap-3 sm:top-10 sm:right-10">
        <Image src={scopifyLogo} alt="" className="size-8 rounded-lg" priority />
        <span className="text-sm font-medium tracking-[0.04em] text-white/72">Scopify</span>
      </div>
      <h1 className="landing-display text-center text-[clamp(3.15rem,12vw,9rem)] leading-[0.9] font-light tracking-[-0.075em] whitespace-nowrap">
        让声音，显形。
      </h1>
    </section>
  );
}
