import Link from "next/link";

import mainScreenshot from "@/assets/features/main.png";
import { LandingScreenshot } from "@/components/marketing/landing-screenshot";

const GITHUB_URL = "https://github.com/MT-SUPER-POWER/Scopify";

export function LandingHero() {
  return (
    <section className="mx-auto flex min-h-[128svh] w-full max-w-[1480px] flex-col px-6 pt-44 sm:px-10 lg:px-16 lg:pt-52">
      <div className="max-w-5xl">
        <p className="mb-7 text-[11px] font-medium tracking-[0.3em] text-white/46 uppercase">
          Scopify · Music player
        </p>
        <h1 className="landing-display max-w-5xl text-[clamp(4rem,9vw,8.8rem)] leading-[0.94] font-light tracking-[-0.065em] text-balance">
          让声音，显形。
        </h1>
        <p className="mt-8 max-w-xl text-base leading-8 text-white/58 sm:text-lg">
          音乐发现、Folia 动态歌词与桌面体验，放在同一个播放器里。
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link
            href="/docs"
            className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/86"
          >
            查看文档
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/14 bg-white/4 px-6 py-3 text-sm font-medium text-white/76 backdrop-blur-md transition hover:border-white/24 hover:bg-white/8 hover:text-white"
          >
            GitHub
          </a>
        </div>
      </div>

      <div className="mt-28 w-full lg:mt-36">
        <LandingScreenshot image={mainScreenshot} alt="Scopify 音乐发现主页" priority />
      </div>
    </section>
  );
}
