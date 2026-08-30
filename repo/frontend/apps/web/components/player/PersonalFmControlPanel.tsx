"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PersonalFmControlTrigger } from "@/components/player/PersonalFmControlTrigger";
import { PersonalFmSelectionTrack } from "@/components/player/PersonalFmSelectionTrack";
import {
  PERSONAL_FM_MODES,
  PERSONAL_FM_SCENE_CATEGORY_LABELS,
  PERSONAL_FM_SCENES,
  getPersonalFmSelectionLabel,
  isPersonalFmPlaybackSource,
} from "@/constants/personalFm";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import { usePersonalFmStore } from "@/store/module/personalFm";
import { usePlayerStore } from "@/store/module/player";
import type { PersonalFmModeId, PersonalFmSceneCategory } from "@/types/personalFm";

const SCENE_CATEGORIES: readonly PersonalFmSceneCategory[] = [
  "mood",
  "activity",
  "genre",
  "language",
];

interface PersonalFmControlPanelProps {
  placement?: "playbar" | "playlist";
}

export function PersonalFmControlPanel({ placement = "playbar" }: PersonalFmControlPanelProps) {
  const { t } = useI18n();
  const isPersonalFm = usePlayerStore((state) => isPersonalFmPlaybackSource(state.playlistId));
  const selection = usePersonalFmStore((state) => state.selection);
  const isLoading = usePersonalFmStore((state) => state.status === "loading");
  const selectionLabel = getPersonalFmSelectionLabel(selection, t);

  if (placement === "playbar" && !isPersonalFm) return null;

  const selectMode = (mode: PersonalFmModeId) =>
    usePersonalFmStore.getState().setSelection({
      mode,
      scene: mode === "SCENE_RCMD" ? (selection.scene ?? "FOCUS") : null,
    });

  const buttonClassName = (active: boolean) =>
    cn(
      "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-wait disabled:opacity-45",
      active
        ? "border-brand/40 bg-brand text-brand-foreground shadow-brand"
        : "border-content/10 bg-surface text-content-muted hover:border-content/20 hover:bg-content/5 hover:text-content",
    );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <PersonalFmControlTrigger
          ariaLabel={t("personalFm.settings.title")}
          iconClassName={placement === "playlist" ? "size-8" : "size-4 lg:size-5"}
          isLoading={isLoading}
        />
      </PopoverTrigger>
      <PopoverContent
        align={placement === "playlist" ? "start" : "end"}
        className="max-h-[min(72vh,36rem)] w-[min(42rem,calc(100vw-2rem))] overflow-y-auto border-border bg-surface-overlay p-4 text-content shadow-floating"
        sideOffset={12}
      >
        <div className="mb-4 flex justify-start">
          <span className="max-w-40 shrink-0 truncate rounded-full bg-content/5 px-2.5 py-1 text-xs font-medium text-content-muted">
            {selectionLabel}
          </span>
        </div>

        <div className="space-y-4">
          <section className="space-y-2">
            <p className="text-xs font-medium text-content-muted">
              {t("personalFm.settings.modeLabel")}
            </p>
            <PersonalFmSelectionTrack>
              {PERSONAL_FM_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  aria-pressed={selection.mode === mode.id}
                  disabled={isLoading}
                  onClick={() => void selectMode(mode.id)}
                  className={buttonClassName(selection.mode === mode.id)}
                >
                  {t(mode.labelKey)}
                </button>
              ))}
            </PersonalFmSelectionTrack>
          </section>

          {SCENE_CATEGORIES.map((category) => (
            <section key={category} className="space-y-2">
              <p className="text-xs font-medium text-content-muted">
                {t(PERSONAL_FM_SCENE_CATEGORY_LABELS[category])}
              </p>
              <PersonalFmSelectionTrack>
                {PERSONAL_FM_SCENES.filter((scene) => scene.category === category).map((scene) => {
                  const active = selection.mode === "SCENE_RCMD" && selection.scene === scene.id;
                  return (
                    <button
                      key={scene.id}
                      type="button"
                      aria-pressed={active}
                      disabled={isLoading}
                      onClick={() =>
                        void usePersonalFmStore
                          .getState()
                          .setSelection({ mode: "SCENE_RCMD", scene: scene.id })
                      }
                      className={buttonClassName(active)}
                    >
                      {t(scene.labelKey)}
                    </button>
                  );
                })}
              </PersonalFmSelectionTrack>
            </section>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
