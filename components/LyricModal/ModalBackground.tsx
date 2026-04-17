"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";
import { useUiStore } from "@/store";

const BackgroundRender = dynamic(
  () => import("@applemusic-like-lyrics/react").then((mod) => mod.BackgroundRender),
  { ssr: false },
);

class WebGLFallbackBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.warn("WebGL Background Render Failed. Falling back to CSS mode.", error.message);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const CSSFallbackBackground = ({ coverUrl }: { coverUrl: string }) => (
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[#0a0a0a]">
    <div
      className="absolute inset-0 opacity-50 transition-all duration-1000 ease-in-out"
      style={{
        backgroundImage: `url(${coverUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: "blur(80px) saturate(200%) brightness(0.6)",
        transform: "scale(1.5) translateZ(0)",
      }}
    />
  </div>
);

export const ModalBackground = ({ coverUrl }: { coverUrl: string }) => {
  const isLyricOpen = useUiStore((s) => s.isLyricsOpen);
  if (!coverUrl) return null;
  return (
    <WebGLFallbackBoundary fallback={<CSSFallbackBackground coverUrl={coverUrl} />}>
      {/* 降低了一点明亮度，让 Spotify 风格的白色文字和控件更加突出 */}
      <div
        className="absolute inset-0 z-0 scale-[1.2] pointer-events-none transition-opacity duration-1000 opacity-90"
        style={{ filter: "blur(24px) brightness(0.7)" }}
      >
        <BackgroundRender
          album={coverUrl}
          playing={isLyricOpen}
          hasLyric={true}
          renderScale={0.35}
          staticMode={false}
        />
      </div>
    </WebGLFallbackBoundary>
  );
};
