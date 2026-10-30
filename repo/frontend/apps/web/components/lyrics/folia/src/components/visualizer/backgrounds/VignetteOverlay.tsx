import React from "react";

// src/components/visualizer/backgrounds/VignetteOverlay.tsx
// Shared dark edge falloff drawn over shell backgrounds; the user setting is stored as its opposite.

interface VignetteOverlayProps {
  disabled?: boolean;
  /** Radius percentage that stays clear before the shadow starts; larger values pull the shadow in. */
  clearStop?: number;
}

const VignetteOverlay: React.FC<VignetteOverlayProps> = ({ disabled = false, clearStop = 40 }) =>
  disabled ? null : (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background: `radial-gradient(circle, transparent ${clearStop}%, rgba(0,0,0,0.6) 100%)`,
      }}
    />
  );

export default VignetteOverlay;
