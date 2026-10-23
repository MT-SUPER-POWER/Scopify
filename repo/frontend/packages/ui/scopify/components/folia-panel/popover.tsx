"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

// Folia settings kit popover (kit/Popover.tsx, kit/popoverPlace.ts): a layer that opens from a
// control, drawn in the panel its anchor is in (the nearest `.st-window`, which must be positioned)
// so it has the panel's variables, placed under or over the anchor and kept inside that panel.
// It closes on Escape, a press outside, focus leaving, a scroll that moves the anchor, and a window
// resize. The caller keeps `open`; the children stay while the layer leaves.

/** Between the anchor and the layer. */
export const POPOVER_GAP = 6;
/** Kept free between the layer and the edges of its container. */
export const POPOVER_GUTTER = 8;

export type PopoverBox = { left: number; top: number; width: number; height: number };
export type PopoverContainer = PopoverBox & { scrollLeft?: number; scrollTop?: number };
export type PopoverSide = "under" | "over";
export type PopoverAlign = "start" | "center" | "end";

export type PopoverPlace = {
  side: PopoverSide;
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  /** The room on that side; a taller layer scrolls inside itself. */
  maxHeight: number;
};

/**
 * Places a layer at its anchor inside the container: on the side asked for, the other one where it
 * is too tall here and fits there, else the roomier one; moved in sideways at the gutter.
 */
export const placePopover = (
  anchor: PopoverBox,
  layer: { width: number; height: number },
  container: PopoverContainer,
  { side, align, fill = false }: { side: PopoverSide; align: PopoverAlign; fill?: boolean },
): PopoverPlace => {
  const { scrollLeft = 0, scrollTop = 0 } = container;
  const room = {
    under:
      container.top +
      container.height -
      POPOVER_GUTTER -
      (anchor.top + anchor.height + POPOVER_GAP),
    over: anchor.top - POPOVER_GAP - (container.top + POPOVER_GUTTER),
  };
  const other: PopoverSide = side === "under" ? "over" : "under";
  const placed =
    layer.height <= room[side] || (layer.height > room[other] && room[side] >= room[other])
      ? side
      : other;
  const vertical =
    placed === "under"
      ? { top: anchor.top + anchor.height + POPOVER_GAP - container.top + scrollTop }
      : { bottom: container.top + container.height - anchor.top + POPOVER_GAP - scrollTop };
  const inside = (distance: number) =>
    Math.max(POPOVER_GUTTER, Math.min(distance, container.width - layer.width - POPOVER_GUTTER));
  const horizontal = fill
    ? { left: POPOVER_GUTTER + scrollLeft, right: POPOVER_GUTTER - scrollLeft }
    : align === "end"
      ? {
          right:
            inside(container.left + container.width - (anchor.left + anchor.width)) - scrollLeft,
        }
      : {
          left:
            inside(
              anchor.left -
                container.left +
                (align === "center" ? (anchor.width - layer.width) / 2 : 0),
            ) + scrollLeft,
        };

  return { side: placed, ...horizontal, ...vertical, maxHeight: Math.max(0, room[placed]) };
};

const TABBABLE =
  ':is(button, [href], input, select, textarea, [tabindex]):not([tabindex="-1"], :disabled)';

type FoliaPopoverProps = {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  side?: PopoverSide;
  align?: PopoverAlign;
  /** As wide as the panel, less a gutter at both sides. */
  fill?: boolean;
  role?: React.AriaRole;
  "aria-label"?: string;
  className?: string;
  children: ReactNode;
};

export function FoliaPopover({
  anchorRef,
  open,
  onClose,
  side = "under",
  align = "start",
  fill = false,
  className = "",
  children,
  ...naming
}: FoliaPopoverProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [place, setPlace] = useState<PopoverPlace | null>(null);
  // A closed layer stays for as long as it takes to leave.
  const [present, setPresent] = useState(open);
  if (open && !present) setPresent(true);

  useLayoutEffect(() => {
    setHost(anchorRef.current?.closest<HTMLElement>(".st-window") ?? null);
  }, [anchorRef, open]);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const layer = layerRef.current;
    if (!open || !host || !anchor || !layer) return undefined;
    const frame = host.getBoundingClientRect();
    setPlace(
      placePopover(
        anchor.getBoundingClientRect(),
        { width: layer.offsetWidth, height: layer.scrollHeight },
        {
          left: frame.left + host.clientLeft,
          top: frame.top + host.clientTop,
          width: host.clientWidth,
          height: host.clientHeight,
          scrollLeft: host.scrollLeft,
          scrollTop: host.scrollTop,
        },
        { side, align, fill },
      ),
    );
    (layer.querySelector<HTMLElement>(TABBABLE) ?? layer).focus({ preventScroll: true });

    const close = () => onCloseRef.current();
    const closeOnPress = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!layer.contains(target) && !anchor.contains(target)) close();
    };
    const closeWhenFocusLeaves = (event: FocusEvent) => {
      const next = event.relatedTarget as Node | null;
      if (!layer.contains(next) && !anchor.contains(next)) close();
    };
    const closeOnScroll = (event: Event) => {
      if (event.target instanceof Node && event.target.contains(anchor)) close();
    };
    document.addEventListener("pointerdown", closeOnPress, true);
    layer.addEventListener("focusout", closeWhenFocusLeaves);
    anchor.addEventListener("focusout", closeWhenFocusLeaves);
    window.addEventListener("scroll", closeOnScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", closeOnPress, true);
      layer.removeEventListener("focusout", closeWhenFocusLeaves);
      anchor.removeEventListener("focusout", closeWhenFocusLeaves);
      window.removeEventListener("scroll", closeOnScroll, true);
      window.removeEventListener("resize", close);
      if (layer.contains(document.activeElement)) anchor.focus({ preventScroll: true });
    };
  }, [open, host, anchorRef, side, align, fill]);

  if (!host || !present) return null;

  const placed = place?.side ?? side;
  const origin = fill || align === "center" ? "center" : align === "end" ? "right" : "left";
  const edges = place
    ? {
        left: place.left,
        right: place.right,
        top: place.top,
        bottom: place.bottom,
        maxHeight: place.maxHeight,
      }
    : fill
      ? { left: POPOVER_GUTTER, right: POPOVER_GUTTER, top: 0 }
      : { left: 0, top: 0 };

  return createPortal(
    <div
      ref={layerRef}
      {...naming}
      tabIndex={-1}
      inert={!open}
      data-leaving={open ? undefined : ""}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !event.nativeEvent.isComposing) {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
      }}
      onAnimationEnd={(event) => {
        if (!open && event.target === event.currentTarget) {
          setPresent(false);
          setPlace(null);
        }
      }}
      style={{
        ...edges,
        transformOrigin: `${origin} ${placed === "over" ? "bottom" : "top"}`,
        ...({ "--st-pop-shift": placed === "over" ? "4px" : "-4px" } as CSSProperties),
        outline: "none",
      }}
      className={`st-pop st-scroll absolute z-30 flex flex-col overflow-y-auto overscroll-contain rounded-[10px] bg-[var(--st-menu)] text-[color:var(--st-t1)] shadow-[0_14px_36px_rgba(0,0,0,0.34),0_0_0_1px_var(--st-line2)] ${fill ? "" : "w-max max-w-[calc(100%-16px)]"}${className}`}
    >
      {children}
    </div>,
    host,
  );
}
