import Image from "next/image";
import Link from "next/link";

import scopifyLogo from "@/assets/logo.png";

const GITHUB_URL = "https://github.com/MT-SUPER-POWER/Scopify";

export function LandingHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex h-24 w-full max-w-[1480px] items-center justify-between px-6 sm:px-10 lg:px-16">
        <Link href="/" className="flex items-center gap-3 text-sm font-semibold tracking-wide">
          <Image src={scopifyLogo} alt="" className="size-8 rounded-lg" priority />
          <span>Scopify</span>
        </Link>
        <nav aria-label="主导航" className="flex items-center gap-2 text-sm text-white/68">
          <Link
            href="/docs"
            className="rounded-full bg-white px-5 py-2.5 font-medium text-black transition hover:bg-white/86"
          >
            查看文档
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-full px-4 py-2.5 transition hover:bg-white/8 hover:text-white"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
