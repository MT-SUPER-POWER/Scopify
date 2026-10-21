"use client";

import { useMotionValueEvent, useScroll } from "framer-motion";
import { Download } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import scopifyLogo from "@/assets/logo.png";
import { ScopifyWordmark } from "@/components/layout/scopify-wordmark";
import {
  LANDING_GITHUB_URL,
  LANDING_RELEASES_URL,
  LANDING_WEB_APP_URL,
} from "@/constants/marketing";

export function LandingHeader() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (value) => setIsScrolled(value > 24));

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
        isScrolled
          ? "border-b border-white/6 bg-[#05060b]/45 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-360 items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link href="/" aria-label="Scopify" className="flex items-center gap-2.5">
          <Image src={scopifyLogo} alt="" className="size-7 object-contain" priority />
          <ScopifyWordmark tone="on-dark" className="w-28" />
        </Link>
        <nav
          aria-label="站点导航"
          className="flex items-center gap-1 text-sm text-white/60 sm:gap-2"
        >
          <a
            href={LANDING_WEB_APP_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-full px-3 py-1.5 transition-colors hover:text-white sm:block"
          >
            在线体验
          </a>
          <Link
            href="/docs"
            className="rounded-full px-3 py-1.5 transition-colors hover:text-white"
          >
            文档
          </Link>
          <a
            href={LANDING_GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-full px-3 py-1.5 transition-colors hover:text-white"
          >
            GitHub
          </a>
          <a
            href={LANDING_RELEASES_URL}
            target="_blank"
            rel="noreferrer"
            className="ml-1 inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[0.8rem] font-semibold text-black transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            <Download className="size-3.5" strokeWidth={2.4} />
            下载
          </a>
        </nav>
      </div>
    </header>
  );
}
