import Link from "next/link";

const GITHUB_URL = "https://github.com/MT-SUPER-POWER/Scopify";

export function LandingClosing() {
  return (
    <section className="relative flex min-h-svh items-center justify-center overflow-hidden px-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(5,6,10,0.55)_25%,rgba(5,6,10,0.96)_100%)]" />
      <div className="relative z-10 flex max-w-4xl flex-col items-center">
        <p className="landing-display text-[clamp(3rem,6.8vw,7.5rem)] leading-[1.02] font-light tracking-[-0.06em] text-balance">
          今晚，从 Scopify 开始。
        </p>
        <p className="mt-7 text-base text-white/48 sm:text-lg">你的音乐还在那里。</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/docs"
            className="rounded-full bg-white px-7 py-3 text-sm font-medium text-black transition hover:bg-white/86"
          >
            查看文档
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/14 bg-white/4 px-7 py-3 text-sm font-medium text-white/72 transition hover:bg-white/8 hover:text-white"
          >
            GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
