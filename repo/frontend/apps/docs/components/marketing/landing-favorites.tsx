import { ArrowRight, Repeat } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { LandingSectionHeading } from "@/components/marketing/landing-section-heading";
import {
  LANDING_FAVORITE_FEATURES,
  LANDING_FEATURES_DOC_URL,
  LANDING_FOLIA_STAGE_SCREENSHOT,
  LANDING_VISUALIZER_MODES,
} from "@/constants/marketing";

export function LandingFavorites() {
  return (
    <section
      aria-labelledby="landing-favorites-title"
      className="mx-auto w-full max-w-360 px-5 sm:px-8 lg:px-12"
    >
      <div className="border-t border-white/12 pt-12 sm:pt-16">
        <LandingSectionHeading
          id="landing-favorites-title"
          title="你会反复回到的地方"
          subtitle="有些功能不只是用过一次，而是每次打开 Scopify，手会自己找过去的地方。"
          icon={<Repeat className="size-4 text-[#1ed760]" strokeWidth={1.8} />}
          meta="8 类能力，构成一个完整的播放器"
        />

        <div className="mt-10 grid items-start gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-20">
          <article className="group">
            <Link
              href={`${LANDING_FEATURES_DOC_URL}#歌词与-folia`}
              className="relative block aspect-video overflow-hidden rounded-xl border border-white/10 bg-white/4 shadow-[0_30px_100px_rgba(0,0,0,0.45)]"
            >
              <Image
                src={LANDING_FOLIA_STAGE_SCREENSHOT.src}
                alt={LANDING_FOLIA_STAGE_SCREENSHOT.alt}
                fill
                placeholder="blur"
                sizes="(min-width: 1024px) 44vw, 92vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </Link>
            <div className="mt-6">
              <span className="text-xs font-bold tracking-[0.18em] text-[#1ed760] uppercase">
                最常停留
              </span>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-white lg:text-3xl">
                Folia 歌词舞台
              </h3>
              <p className="mt-1 text-sm text-white/50">封面、流体背景与逐字歌词在同一画面</p>
              <p className="mt-3 text-sm font-bold text-[#1ed760]">
                {LANDING_VISUALIZER_MODES.length} 种歌词动画，随时切换
              </p>
              <p className="mt-2 max-w-md text-sm leading-7 text-white/50">
                播放时点开它，这首歌就不只是被听见。歌词来源、时间轴偏移和均衡器，也都在舞台旁边。
              </p>
            </div>
          </article>

          <ol className="divide-y divide-white/10 border-y border-white/10">
            {LANDING_FAVORITE_FEATURES.map((feature, index) => (
              <li key={feature.title}>
                <Link href={feature.href} className="group flex items-center gap-4 py-4 sm:gap-5">
                  <span className="w-5 shrink-0 text-sm font-black text-white/30 tabular-nums">
                    {index + 1}
                  </span>
                  <div className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-md border border-white/10 bg-white/4 sm:w-28">
                    <Image
                      src={feature.screenshot.src}
                      alt={feature.screenshot.alt}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white transition-colors group-hover:text-[#1ed760] sm:text-base">
                      {feature.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/45 sm:text-sm">
                      {feature.detail}
                    </p>
                  </div>
                  <span className="hidden shrink-0 text-xs font-medium text-white/45 sm:block">
                    {feature.meta}
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-white/30 transition-all group-hover:translate-x-0.5 group-hover:text-white" />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
