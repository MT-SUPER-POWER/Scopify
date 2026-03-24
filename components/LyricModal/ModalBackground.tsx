"use client";

import { Component, ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePlayerStore } from "@/store";

const BackgroundRender = dynamic(
  () => import("@applemusic-like-lyrics/react").then((mod) => mod.BackgroundRender),
  { ssr: false }
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
      className="absolute inset-0 opacity-60 transition-all duration-1000 ease-in-out"
      style={{
        backgroundImage: `url(${coverUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: "blur(80px) saturate(150%) brightness(0.8)",
        transform: "scale(1.5) translateZ(0)",
      }}
    />
  </div>
);

export const ModalBackground = ({ coverUrl }: { coverUrl: string }) => {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  if (!coverUrl) return null;
  return (
    <WebGLFallbackBoundary fallback={<CSSFallbackBackground coverUrl={coverUrl} />}>
      <div
        className="absolute inset-0 z-0 scale-[1.2] pointer-events-none transition-opacity duration-1000"
        style={{ filter: "blur(16px)" }}
      >
        <BackgroundRender
          album={coverUrl}
          playing={isPlaying}
          hasLyric={true}
          renderScale={0.35}
          staticMode={false}
        />
      </div>
    </WebGLFallbackBoundary>
  );
};
