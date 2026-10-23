"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Disc, Heart } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ComponentType,
  type ReactNode,
  type RefObject,
} from "react";

import {
  FoliaIconButton,
  FoliaIconSwap,
  FoliaSegments,
} from "@scopify/ui/scopify/components/folia-panel/controls";
import {
  kitTransition,
  useKitReducedMotion,
} from "@scopify/ui/scopify/components/folia-panel/motion";
import {
  FoliaPanelThemeContext,
  panelTokens,
  type FoliaPanelColors,
} from "@scopify/ui/scopify/components/folia-panel/tokens";

// Folia's player panel frame (panelTab/shell/PanelShell.tsx, TabDock.tsx, SongHeader.tsx,
// LikeButton.tsx, useMeasuredSize.ts). The glass surface stands above the round handle and grows
// out of it. Top to bottom: the song (big cover on the cover tab, one folded line elsewhere), the
// open tab (scrolls inside when the window is short) and the tab row at the bottom edge. Each tab
// gets the height its content needs: the content is measured and the surface follows with the
// kit's unfold motion, upward from the tab row.

/** The handle's height and the gap above it. */
const HANDLE_ROOM_PX = 60;
/** Under the surface when no handle is drawn below it. */
const BARE_GAP_PX = 8;
/** Kept free between the surface and the top of the window. */
const TOP_MARGIN_PX = 56;
const PADDING_PX = 12;
const DOCK_HEIGHT_PX = 36;
const DOCK_GAP_PX = 12;
/** Above the open tab: the gap, the hairline, and the gap under it. */
const BODY_TOP_PX = { gap: 12, line: 1, under: 8 } as const;
/** The height of the folded song line, and the side of its cover. */
export const FOLIA_FOLDED_PX = 48;
const COVER_GAP_PX = 14;
const MIN_COVER_PX = 96;

type Size = { width: number; height: number };

/** The element's laid-out size, read before the first paint, again on `dep`, then on every resize. */
export function useFoliaMeasuredSize(ref: RefObject<HTMLElement | null>, dep?: unknown): Size {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const read = () => {
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      setSize((previous) =>
        previous.width === width && previous.height === height ? previous : { width, height },
      );
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, dep]);

  return size;
}

type FoliaPanelShellProps = {
  isOpen: boolean;
  /** The round handle stays under the open surface: the surface stands above it. */
  hasHandle: boolean;
  /** The cover tab is open: the header is the whole panel and there is no tab body. */
  isCover: boolean;
  /** Names the open tab: a new value brings its body in, measures it and scrolls it to the top. */
  tabKey: string;
  isDaylight: boolean;
  colors: FoliaPanelColors;
  /** The surface's bottom edge above the window's, before the handle room. */
  bottomPx?: number;
  /** The song. It may use --pn-room (its height on the cover tab) and 100cqw (the inner width). */
  header: ReactNode;
  /** The tab row. */
  dock: ReactNode;
  /** The round button that opens and closes the panel. */
  handle?: ReactNode;
  /** The open tab's body. It may use --pn-tab-room, the height it can take before it scrolls. */
  children: ReactNode;
};

function FoliaPanelSurface({
  hasHandle,
  isCover,
  tabKey,
  isDaylight,
  colors,
  bottomPx,
  header,
  dock,
  children,
}: Omit<FoliaPanelShellProps, "isOpen" | "handle"> & { bottomPx: number }) {
  const reduced = useKitReducedMotion();
  const underPx = hasHandle ? HANDLE_ROOM_PX : BARE_GAP_PX;
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const content = useFoliaMeasuredSize(contentRef, tabKey);
  // Nothing inside moves until the surface has been painted once.
  const [isStill, setIsStill] = useState(true);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsStill(false));
    return () => cancelAnimationFrame(frame);
  }, []);
  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [tabKey]);

  const bodyHeight = isCover
    ? 0
    : BODY_TOP_PX.gap + BODY_TOP_PX.line + BODY_TOP_PX.under + content.height;
  const away = { opacity: 0, scale: 0.92 };

  return (
    <motion.div
      initial={away}
      animate={{ opacity: 1, scale: 1, transition: kitTransition("unfold", reduced) }}
      exit={{ ...away, transition: kitTransition("move", reduced) }}
      data-still={isStill || undefined}
      onClick={(event) => event.stopPropagation()}
      className="st-window hide-scrollbar @container pointer-events-auto relative flex w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-x-hidden overflow-y-auto rounded-[20px] bg-[var(--pn-glass)] text-[color:var(--st-t1)] shadow-[var(--pn-shadow)] backdrop-blur-[40px] backdrop-saturate-[1.3] [&[data-still]_*]:transition-none"
      style={
        {
          ...panelTokens(isDaylight, colors, reduced),
          "--pn-under": `${underPx}px`,
          "--pn-room": `calc(100dvh - var(--pn-under) - ${bottomPx + TOP_MARGIN_PX + 2 * PADDING_PX + DOCK_GAP_PX + DOCK_HEIGHT_PX}px)`,
          // What is left under the folded song line and the hairline: a tab with a list of its own
          // ends the list there, so the list scrolls and the tab does not.
          "--pn-tab-room": `calc(var(--pn-room) - ${FOLIA_FOLDED_PX + BODY_TOP_PX.gap + BODY_TOP_PX.line + BODY_TOP_PX.under}px)`,
          maxHeight: `calc(100dvh - var(--pn-under) - ${bottomPx + TOP_MARGIN_PX}px)`,
          padding: PADDING_PX,
          marginBottom: underPx,
          // The centre of the handle, at the surface's right end.
          transformOrigin: `calc(100% - 24px) calc(100% + ${underPx - 24}px)`,
        } as CSSProperties
      }
    >
      {header}

      <div
        className="st-t-unfold flex min-h-0 shrink flex-col overflow-hidden transition-[height]"
        style={{ height: bodyHeight, marginInline: -PADDING_PX }}
      >
        <div
          className="h-px shrink-0 bg-[var(--st-line)]"
          style={{ marginTop: BODY_TOP_PX.gap, marginInline: PADDING_PX }}
        />
        <div
          ref={scrollRef}
          className="st-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]"
          style={{ paddingTop: BODY_TOP_PX.under, paddingLeft: PADDING_PX }}
        >
          <div ref={contentRef} key={tabKey} className="st-page-in">
            {children}
          </div>
        </div>
      </div>

      <div className="shrink-0" style={{ height: DOCK_HEIGHT_PX, marginTop: DOCK_GAP_PX }}>
        {dock}
      </div>
    </motion.div>
  );
}

export function FoliaPanelShell({
  isOpen,
  handle,
  bottomPx = 32,
  ...surface
}: FoliaPanelShellProps) {
  return (
    <FoliaPanelThemeContext.Provider value={{ isDaylight: surface.isDaylight }}>
      <div
        className="pointer-events-none fixed right-0 z-60 flex flex-col items-end"
        style={{ bottom: bottomPx }}
      >
        <div className="pr-4 md:pr-8">
          <AnimatePresence>
            {isOpen ? <FoliaPanelSurface {...surface} bottomPx={bottomPx} /> : null}
          </AnimatePresence>
        </div>
        {handle}
      </div>
    </FoliaPanelThemeContext.Provider>
  );
}

export type FoliaDockTab<T extends string> = {
  id: T;
  label: string;
  icon: ComponentType<{ size?: number }>;
};

/**
 * The tab row at the panel's bottom edge. Every tab shows its name while the names fit; otherwise
 * the tabs that are not open show only their icon. Whether they fit is measured off-screen.
 */
export function FoliaTabDock<T extends string>({
  tabs,
  currentTab,
  onTabChange,
}: {
  tabs: ReadonlyArray<FoliaDockTab<T>>;
  currentTab: T;
  onTabChange: (tab: T) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const namesRef = useRef<HTMLDivElement>(null);
  const row = useFoliaMeasuredSize(rowRef);
  const names = useFoliaMeasuredSize(namesRef);
  const showNames = names.width <= row.width + 1;

  return (
    <div ref={rowRef} className="relative h-full">
      <FoliaSegments
        size="l"
        fill
        value={currentTab}
        onChange={onTabChange}
        options={tabs.map((tab) => ({
          value: tab.id,
          label: tab.label,
          icon: showNames ? undefined : <tab.icon size={16} />,
          iconOnly: !showNames && tab.id !== currentTab,
        }))}
      />
      <div
        aria-hidden
        className="pointer-events-none invisible absolute inset-x-0 top-0 h-0 overflow-hidden"
      >
        <div ref={namesRef} className="inline-flex px-0.5 text-[13px]">
          {tabs.map((tab) => (
            <span key={tab.id} className="px-2.5 whitespace-nowrap">
              {tab.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Whether the playing song is liked, the action, and whether it is out of reach and why. */
export type FoliaSongLike = {
  isLiked: boolean;
  onLike: () => void;
  disabled?: boolean;
  /** The tooltip: like / unlike, or why it is out of reach. */
  label: string;
};

export function FoliaLikeButton({
  like,
  filled,
  size = "m",
  className,
}: {
  like: FoliaSongLike;
  filled?: boolean;
  size?: "m" | "l";
  className?: string;
}) {
  return (
    <FoliaIconButton
      label={like.label}
      size={size}
      filled={filled}
      pressed={like.isLiked}
      disabled={like.disabled}
      onClick={like.onLike}
      className={className}
      style={like.isLiked ? { color: "var(--pn-like)" } : undefined}
    >
      <FoliaIconSwap name={String(like.isLiked)} speed="move">
        <Heart size={size === "l" ? 19 : 17} fill={like.isLiked ? "currentColor" : "none"} />
      </FoliaIconSwap>
    </FoliaIconButton>
  );
}

/**
 * The playing song at the top of the panel. On the cover tab: the large cover with `children`
 * under it. On every other tab: one line (small cover, title, artist, heart) that goes to the cover
 * tab when pressed. Both forms are in the document at once, so the cover can grow and shrink.
 */
export function FoliaSongHeader({
  isBig,
  songKey,
  title,
  artists,
  coverUrl,
  like,
  onShowCover,
  children,
}: {
  isBig: boolean;
  /** A new song's line comes in as a page does. */
  songKey: string;
  title: string;
  artists: string;
  coverUrl: string | null;
  like: FoliaSongLike;
  onShowCover: () => void;
  children: ReactNode;
}) {
  const underRef = useRef<HTMLDivElement>(null);
  const under = useFoliaMeasuredSize(underRef);
  const underPx = COVER_GAP_PX + under.height;
  // A square as wide as the panel's inside (100cqw), lower where the window leaves less.
  const coverHeight = `clamp(${MIN_COVER_PX}px, calc(var(--pn-room) - ${underPx}px), 100cqw)`;

  return (
    <header
      className="st-t-unfold relative shrink-0 overflow-hidden transition-[height]"
      style={{ height: isBig ? `calc(${coverHeight} + ${underPx}px)` : FOLIA_FOLDED_PX }}
    >
      <div
        onClick={isBig ? undefined : onShowCover}
        className={`st-t-unfold absolute top-0 left-0 grid place-items-center overflow-hidden bg-[var(--st-fill)] transition-[width,height,border-radius] ${isBig ? "rounded-[10px]" : "cursor-pointer rounded-lg"}`}
        style={
          isBig
            ? { width: "100%", height: coverHeight }
            : { width: FOLIA_FOLDED_PX, height: FOLIA_FOLDED_PX }
        }
      >
        {coverUrl ? (
          <img src={coverUrl} alt="" decoding="async" className="h-full w-full object-cover" />
        ) : (
          <Disc size={isBig ? 40 : 20} className="text-[color:var(--st-t3)]" />
        )}
        <span className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_1px_var(--st-line)]" />
      </div>

      <button
        key={songKey}
        type="button"
        onClick={onShowCover}
        inert={isBig}
        className={`st-page-in st-t-move absolute top-[5px] right-11 left-[60px] flex flex-col text-left transition-[opacity,translate] ${isBig ? "-translate-y-1 opacity-0" : ""}`}
      >
        <span className="truncate text-sm leading-5 font-semibold">{title}</span>
        <span className="truncate text-xs leading-[18px] text-[color:var(--st-t2)]">{artists}</span>
      </button>
      <FoliaLikeButton
        like={like}
        className={`st-t-move absolute top-2 right-0 transition-[opacity,translate,visibility] ${isBig ? "invisible -translate-y-1 opacity-0" : ""}`}
      />

      <div
        ref={underRef}
        inert={!isBig}
        className={`absolute inset-x-1 bottom-0 transition-[opacity,translate,visibility] ${isBig ? "st-t-move" : "st-t-fast invisible translate-y-2 opacity-0"}`}
      >
        {children}
      </div>
    </header>
  );
}
