/**
 * The flip from skeleton to content. Every card turns on one clock: zero velocity at both ends so
 * nothing lurches, and a stagger whose total is fixed so a big wall takes no longer than a small one.
 */
const FLIP_DURATION = 720;
const FLIP_EASING = "cubic-bezier(0.45, 0, 0.15, 1)";
/** Cards rise slightly towards the viewer at the edge-on point, which is what makes it read as a tumble. */
const FLIP_LIFT = 0.04;
const FLIP_SAMPLES = 8;

/** Delay of the card furthest from the pane centre. */
export const FLIP_SPREAD = 380;
/** Covers get this long to decode so a card does not land on an empty sleeve; slow ones appear later. */
export const FLIP_DECODE_LIMIT = 450;
export const FLIP_TOTAL = FLIP_DURATION + FLIP_SPREAD;

const flipKeyframes = (from: number, to: number, perspective: number) =>
  Array.from({ length: FLIP_SAMPLES + 1 }, (_, step) => {
    const progress = step / FLIP_SAMPLES;
    const lift = 1 + FLIP_LIFT * Math.sin(Math.PI * progress);
    const angle = from + (to - from) * progress;
    return { transform: `perspective(${perspective}px) rotateY(${angle}deg) scale(${lift})` };
  });

/**
 * Turns both faces half a revolution. Each face rotates on its own and hides its back, so no 3D
 * context is needed around them and the two can never be visible at once.
 */
export function startCardFlip(front: HTMLElement, back: HTMLElement, delay: number) {
  const perspective = Math.max(back.offsetWidth, back.offsetHeight) * 3;
  const timing = { duration: FLIP_DURATION, delay, easing: FLIP_EASING, fill: "both" } as const;
  return [
    front.animate(flipKeyframes(0, 180, perspective), timing),
    back.animate(flipKeyframes(-180, 0, perspective), timing),
  ];
}

// A skeleton that stood in for data arms the flip, and so does the user changing layout. It stays
// armed only until the current task ends: the view being waited for mounts in the same commit,
// anything later (a cached page, another route) finds it disarmed. That one rule is what keeps
// re-entering a page quiet.
let armed = false;
let toolsStay = false;
let skeletons = 0;
let disarmTimer = 0;

/** The user changed layout. `keepTools`: the floating tools were already on screen, so they do not fade in. */
export function armFlipReveal(keepTools: boolean) {
  window.clearTimeout(disarmTimer);
  armed = true;
  toolsStay = keepTools;
}

/** Disarms when the current task ends, unless a skeleton is still standing in for the view. */
export function disarmFlipReveal() {
  if (skeletons > 0) return;
  disarmTimer = window.setTimeout(() => {
    armed = false;
    toolsStay = false;
  });
}

export function holdFlipReveal(arm: boolean) {
  skeletons += 1;
  window.clearTimeout(disarmTimer);
  if (arm) armed = true;
}

export function releaseFlipReveal() {
  skeletons -= 1;
  disarmFlipReveal();
}

export const isFlipRevealArmed = () => armed;
export const isFlipRevealKeepingTools = () => toolsStay;

/** How long the outgoing wall takes to clear before the next layout flips in. */
const WALL_EXIT_DURATION = 160;

/** Fades a wall's content off its own background; the floating tools stay where they are. */
export function fadeOutWall(wall: Element) {
  const parts = [...wall.children].filter((part) => !part.hasAttribute("data-playlist-view-tools"));
  return parts.map((part) =>
    part.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: WALL_EXIT_DURATION,
      easing: "ease-out",
      fill: "forwards",
    }),
  );
}
