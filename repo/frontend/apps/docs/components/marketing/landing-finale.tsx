import { ArrowUpRight, Download, Globe } from "lucide-react";
import Link from "next/link";

import { LandingReveal } from "@/components/marketing/landing-reveal";
import {
  LANDING_GITHUB_URL,
  LANDING_RELEASES_URL,
  LANDING_WEB_APP_URL,
} from "@/constants/marketing";

/** 页脚只放上方两个按钮之外的次要入口。 */
const FOOTER_LINKS = [
  { href: "/docs", label: "文档", external: false },
  { href: LANDING_RELEASES_URL, label: "版本发布", external: true },
  { href: `${LANDING_GITHUB_URL}/issues`, label: "问题反馈", external: true },
  { href: LANDING_GITHUB_URL, label: "GitHub", external: true },
] as const;

const footerLinkClass =
  "group inline-flex items-center gap-1 text-white/55 transition-colors hover:text-white";

/**
 * 尾声：和首屏一样恰好占满一屏，滚到页底时标题、按钮与页脚完整地同框；
 * 迷你播放器在这一章退场，不再遮挡页底。
 */
export function LandingFinale() {
  return (
    <section
      data-landing-chapter="outro"
      aria-labelledby="landing-finale-title"
      className="relative flex min-h-svh flex-col pt-16"
    >
      <div className="relative mx-auto flex w-full max-w-360 flex-1 flex-col items-center justify-center px-5 py-[5svh] text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(42%_46%_at_50%_52%,rgba(5,6,11,0.62),transparent_78%)]"
        />
        <LandingReveal className="flex flex-col items-center">
          <h2
            id="landing-finale-title"
            className="landing-display text-[clamp(2.4rem,min(7vw,11svh),6.4rem)] leading-[1.08] font-semibold tracking-[-0.045em] text-white"
          >
            <span className="relative inline-block">
              每一句<span className="absolute left-full">，</span>
            </span>
            <br />
            <span className="landing-shimmer relative inline-block">
              都有自己的样子<span className="absolute left-full text-white">。</span>
            </span>
          </h2>
          <p className="mt-[3svh] text-sm text-white/55 sm:text-base">
            Scopify · 网易云音乐的开源桌面客户端
          </p>
          <div className="mt-[5svh] flex flex-wrap justify-center gap-3">
            <a
              href={LANDING_RELEASES_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[#1ed760] px-7 text-sm font-bold text-black shadow-[0_12px_48px_rgba(30,215,96,0.32)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              <Download className="size-4" strokeWidth={2.4} />
              下载桌面端
            </a>
            <a
              href={LANDING_WEB_APP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 bg-white/6 px-7 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:border-white/30 hover:bg-white/12"
            >
              <Globe className="size-4" />
              在线体验
            </a>
          </div>
        </LandingReveal>
      </div>

      <footer className="mx-auto w-full max-w-360 px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col-reverse gap-3 border-t border-white/8 py-6 text-xs text-white/35 md:flex-row md:items-center md:justify-between">
          <p>以 AGPL-3.0 协议开源 · 第三方客户端，与网易云音乐官方无关</p>
          <nav aria-label="更多入口" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {FOOTER_LINKS.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className={footerLinkClass}
                >
                  {link.label}
                  <ArrowUpRight className="size-3 opacity-50 transition-[opacity,translate] group-hover:translate-x-px group-hover:-translate-y-px group-hover:opacity-100" />
                </a>
              ) : (
                <Link key={link.label} href={link.href} className={footerLinkClass}>
                  {link.label}
                </Link>
              ),
            )}
          </nav>
        </div>
      </footer>
    </section>
  );
}
