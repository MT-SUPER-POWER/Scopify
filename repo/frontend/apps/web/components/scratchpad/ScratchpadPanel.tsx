// Adapted from chthollyphile/folia-major v0.8.0 (3b91924f1), AGPL-3.0.
import type { ScratchpadPanelProps } from "@/types/scratchpad/folia";
import { usePaperMotions } from "@/hooks/scratchpad/usePaperMotions";
import "./folia-scratchpad.css";
import React, { useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, Maximize2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ScratchpadSection as ScratchpadTab } from "@/types/scratchpad/components";
import ScratchpadBand, { ScratchpadSlim } from "./ScratchpadBand";
import ScratchpadGreeting from "./ScratchpadGreeting";
import { SCRATCHPAD_TABS } from "@/lib/scratchpad/scratchpadLook";
import { PAPER_FACE_VARIANTS, panelPaperFrame } from "@/lib/scratchpad/scratchpadPaper";

// src/components/app/scratchpad/ScratchpadPanel.tsx
// 左缘的面板（设计稿 A 按 F 定稿适配；盖在墙上，不推开墙）：四页各一条米白的纸——这一页是顶上的信息条（ScratchpadBand），
// 另外三页是压在底部的细纸带（ScratchpadSlim），点一下换过去；与展开整页一一对应（scratchpadPaper.ts 的文件头）。

// 换页时三条纸照展开整页的走法挪：底部那条升到顶上、长高；顶上那条从上方出去，再从下面升回到底部。
// 信息条下面是放大的问候和一道点缀色的短杠，再下面是这一页（宿主交进来的 children：说明、列表、底部按钮）。

// 展开整页时不用它，换成 ScratchpadSheet（倾斜的纸）。

const TAB_TITLE_KEYS: Record<ScratchpadTab, import("@/lib/i18n").TranslationKey> = {
  notes: "scratchpad.title",
  history: "scratchpad.tabHistory",
  queue: "scratchpad.tabQueue",
  moments: "scratchpad.tabMoments",
};

type PaperMode = "band" | "slim";

const ScratchpadPanel: React.FC<ScratchpadPanelProps> = ({
  tab,
  counts,
  slimOrder,
  onSelectTab,
  onClose,
  expandLabel,
  onExpand,
  showIntro = true,
  children,
}) => {
  const { t } = useTranslation();
  const calm = Boolean(useReducedMotion());
  const expandRef = useRef<HTMLButtonElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const measure = () => setView({ width: host.clientWidth, height: host.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);
  const motionOf = usePaperMotions<PaperMode>("slim");
  const indexOf = (id: ScratchpadTab) => String(SCRATCHPAD_TABS.indexOf(id) + 1).padStart(2, "0");

  return (
    <div ref={hostRef} className="scratchpad-drawer is-panel">
      {view.width > 0 &&
        SCRATCHPAD_TABS.map((id) => {
          const mode: PaperMode = id === tab ? "band" : "slim";
          const frame = panelPaperFrame(
            mode === "band" ? "band" : slimOrder.indexOf(id),
            view.width,
            view.height,
          );
          // 绕一圈去底部时从窗口上方出去、从窗口下面回来。
          const paperMotion = motionOf(id, mode, frame, {
            calm,
            above: -24,
            below: view.height + 24,
          });
          const title = t(TAB_TITLE_KEYS[id]);
          const countLabel = t("scratchpad.count", { count: counts[id] });
          return (
            <motion.div
              key={id}
              className={`scratchpad-panel-paper is-${mode}`}
              data-page={id}
              initial={false}
              animate={paperMotion.animate}
              transition={paperMotion.transition}
            >
              <div className="scratchpad-panel-paper-sheet">
                {/* 退场的那一面拿的是 AnimatePresence 的 custom（这一次的动法）：绕一圈时它要留到出了视口才换。 */}
                <AnimatePresence initial={false} custom={paperMotion}>
                  <motion.div
                    key={mode}
                    className="scratchpad-sheet-band-face"
                    custom={paperMotion}
                    variants={PAPER_FACE_VARIANTS}
                    initial="hidden"
                    animate="shown"
                    exit="gone"
                  >
                    {mode === "band" ? (
                      <ScratchpadBand
                        tab={id}
                        index={indexOf(id)}
                        title={title}
                        count={counts[id]}
                      />
                    ) : (
                      <ScratchpadSlim
                        tab={id}
                        index={indexOf(id)}
                        title={title}
                        countLabel={countLabel}
                        openLabel={t("scratchpad.expandPage")}
                        ariaLabel={`${title} · ${countLabel}`}
                        onOpen={(id) => {
                          onSelectTab(id);
                          if (document.activeElement?.matches(":focus-visible"))
                            expandRef.current?.focus({ preventScroll: true });
                        }}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      <div className="scratchpad-sheet">
        <div className="scratchpad-panel-band">
          <button
            type="button"
            className="scratchpad-band-fold"
            title={t("ui.close")}
            aria-label={t("ui.close")}
            onClick={onClose}
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <button
            type="button"
            ref={expandRef}
            className="scratchpad-band-expand"
            data-scratchpad-action="toggle-canvas"
            title={expandLabel}
            aria-label={expandLabel}
            aria-pressed={false}
            onClick={onExpand}
          >
            <Maximize2 aria-hidden="true" />
          </button>
        </div>

        {showIntro && (
          <div className="scratchpad-intro">
            <ScratchpadGreeting long={false} headline />
            <span className="scratchpad-intro-rule" aria-hidden="true" />
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default ScratchpadPanel;
