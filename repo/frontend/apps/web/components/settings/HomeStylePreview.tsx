"use client";

import { AppBackground } from "@/components/shared/AppBackground";
import { useI18n } from "@/store/module/i18n";

const CARD_COUNT = 6;

/**
 * 外观设置里的首页缩略预览：背景、标题与卡片的配色都走真实的语义 token，
 * 但内容是静态示意，不请求数据，改主题时预览立即可见，离线也不会失败。
 */
export function HomeStylePreview() {
  const { t } = useI18n();
  const sections = [
    t("home.madeFor", { name: t("home.you") }),
    t("home.recentlyPlayedPlaylists"),
    t("home.newAlbums"),
  ];

  return (
    <div className="relative min-h-screen bg-surface-raised pb-24 font-sans">
      <AppBackground />
      <div className="relative z-10 mx-auto w-full max-w-400 space-y-7 px-4 py-6 sm:px-6">
        {sections.map((title) => (
          <section key={title} className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-content sm:text-2xl">{title}</h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,176px),1fr))] gap-x-2">
              {Array.from({ length: CARD_COUNT }, (_, index) => (
                <div key={index} className="flex flex-col gap-3 p-2">
                  <div className="aspect-square w-full rounded-md bg-surface-sunken shadow-panel" />
                  <div className="flex flex-col gap-1.5">
                    <div className="h-4 w-3/4 rounded bg-content/10" />
                    <div className="h-3 w-1/2 rounded bg-content/5" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
