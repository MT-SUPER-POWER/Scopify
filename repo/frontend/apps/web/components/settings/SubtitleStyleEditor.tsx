import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";

import type { SubtitleSettingsEditorProps } from "@/types/lyrics/subtitlePreview";
import { SubtitleLayoutSettings } from "./SubtitleLayoutSettings";
import { SubtitleEffectsSettings } from "./SubtitleEffectsSettings";
import { SubtitleFillSettings } from "./SubtitleFillSettings";
import { SubtitleMotionSettings } from "./SubtitleMotionSettings";

export function SubtitleStyleEditor(props: SubtitleSettingsEditorProps) {
  const { t } = useTranslation();
  return (
    <Tabs defaultValue="layout">
      <TabsList className="mb-6 h-auto w-fit max-w-full flex-wrap justify-start">
        <TabsTrigger value="layout">{t("subtitlePreview.layout")}</TabsTrigger>
        <TabsTrigger value="effects">{t("subtitlePalette.effects")}</TabsTrigger>
        <TabsTrigger value="motion">{t("subtitlePalette.playback")}</TabsTrigger>
      </TabsList>
      <TabsContent value="layout">
        <SubtitleLayoutSettings {...props} />
      </TabsContent>
      <TabsContent value="effects">
        <SubtitleEffectsSettings {...props} />
      </TabsContent>
      <TabsContent value="motion" className="space-y-8">
        <SubtitleFillSettings {...props} />
        <SubtitleMotionSettings {...props} />
      </TabsContent>
    </Tabs>
  );
}
