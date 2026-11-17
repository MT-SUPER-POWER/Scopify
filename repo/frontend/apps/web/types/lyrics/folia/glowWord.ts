export interface GlowWordPose {
  scale: number;
  rotate: number;
  passedRotate: number;
}

export interface GlowWordPlacement {
  width: number;
  pose: GlowWordPose;
  offset?: { x: number; y: number };
}

export interface GlowWordOverflow {
  left: number;
  right: number;
  top: number;
  bottom: number;
}
