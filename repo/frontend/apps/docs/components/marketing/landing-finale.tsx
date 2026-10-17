import Image from "next/image";
import Link from "next/link";

import scopifyLogo from "@/assets/logo.png";
import {
  LANDING_FOLIA_STAGE_SCREENSHOT,
  LANDING_GITHUB_URL,
  LANDING_RELEASES_URL,
  LANDING_WEB_APP_URL,
} from "@/constants/marketing";

const FINALE_LINKS = [
  { eyebrow: "Try it online", href: LANDING_WEB_APP_URL, label: "在线体验", external: true },
  { eyebrow: "Documentation", href: "/docs", label: "阅读文档", external: false },
  { eyebrow: "Download", href: LANDING_RELEASES_URL, label: "下载桌面端", external: true },
  { eyebrow: "Source code", href: LANDING_GITHUB_URL, label: "查看源码", external: true },
] as const;

const linkClass =
  "group flex items-end justify-between border-b border-white/12 py-5 text-white/72 sm:odd:pr-6 sm:even:pl-6 lg:border-b-0 lg:border-l lg:px-6 lg:first:border-l-0 lg:first:pl-0";

function FinaleLinkBody({ eyebrow, external, label }: (typeof FINALE_LINKS)[number]) {
  return (
    <>
      <span>
        <span className="block text-[0.65rem] tracking-[0.16em] text-white/35 uppercase">
          {eyebrow}
        </span>
        <span className="mt-1 block text-xl tracking-[-0.03em] transition-colors group-hover:text-white">
          {label}
        </span>
      </span>
      <span
        className={`text-xl transition-transform duration-300 group-hover:translate-x-1 ${
          external ? "group-hover:-translate-y-1" : ""
        }`}
      >
        {external ? "↗" : "→"}
      </span>
    </>
  );
}

/** 听歌报告 Grand Finale 式的收尾：封面消融 + 一句总结 + 项目入口。 */
export function LandingFinale() {
  return (
    <section
      aria-labelledby="landing-finale-title"
      className="mx-auto w-full max-w-360 px-5 sm:px-8 lg:px-12"
    >
      <div className="group relative flex min-h-64 items-center overflow-hidden rounded-xl border border-white/10 bg-white/3 p-6 sm:min-h-80 sm:p-12">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[46%] overflow-hidden select-none sm:w-[40%] lg:w-[34%]">
          <Image
            src={LANDING_FOLIA_STAGE_SCREENSHOT.src}
            alt=""
            fill
            sizes="40vw"
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-[#0b0d16]/80 to-[#0b0d16]" />
        </div>

        <div className="relative z-10 pl-[44%] sm:pl-[40%] lg:pl-[36%]">
          <h2
            id="landing-finale-title"
            className="landing-display text-[clamp(1.6rem,3.4vw,3rem)] leading-[1.25] font-medium tracking-[-0.03em] text-white"
          >
            每一句，都有自己的样子。
          </h2>
          <div className="mt-5 flex items-center gap-2.5 text-xs text-white/50 sm:text-sm">
            <Image src={scopifyLogo} alt="" className="size-5 rounded" />
            <span>Scopify · 网易云音乐 × Folia 的开源桌面播放器</span>
          </div>
        </div>
      </div>

      <nav
        aria-label="项目入口"
        className="mt-10 grid border-t border-white/12 sm:grid-cols-2 lg:grid-cols-4"
      >
        {FINALE_LINKS.map((link) =>
          link.external ? (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className={linkClass}
            >
              <FinaleLinkBody {...link} />
            </a>
          ) : (
            <Link key={link.label} href={link.href} className={linkClass}>
              <FinaleLinkBody {...link} />
            </Link>
          ),
        )}
      </nav>

      <footer className="mt-16 flex flex-col gap-2 border-t border-white/8 pt-6 pb-10 text-xs text-white/32 sm:flex-row sm:justify-between">
        <span>以 AGPL-3.0 协议开源 · 网页端与 Windows 桌面端</span>
        <span>Scopify 是第三方客户端，与网易云音乐官方无关。</span>
      </footer>
    </section>
  );
}
