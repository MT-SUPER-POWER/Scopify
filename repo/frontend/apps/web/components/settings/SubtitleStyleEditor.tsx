import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/store/module/i18n";
import type { SubtitleSettingsEditorProps } from "@/types/subtitle-preview";
import { SubtitleLayoutSettings } from "./SubtitleLayoutSettings";
import { SubtitleColorSettings } from "./SubtitleColorSettings";
import { SubtitleFillSettings } from "./SubtitleFillSettings";
import { SubtitleMotionSettings } from "./SubtitleMotionSettings";

export function SubtitleStyleEditor(props: SubtitleSettingsEditorProps) {
  const { t } = useI18n();
  return (
    <Tabs defaultValue="colors">
      <TabsList className="mb-6 h-auto max-w-full flex-wrap">
        <TabsTrigger value="colors">{t("subtitlePreview.colors")}</TabsTrigger>
        <TabsTrigger value="layout">{t("subtitlePreview.layout")}</TabsTrigger>
        <TabsTrigger value="motion">{t("subtitlePreview.motion")}</TabsTrigger>
      </TabsList>
      <TabsContent value="colors">
        <SubtitleColorSettings {...props} />
      </TabsContent>
      <TabsContent value="layout">
        <SubtitleLayoutSettings {...props} />
      </TabsContent>
      <TabsContent value="motion" className="space-y-8">
        <SubtitleFillSettings {...props} />
        <SubtitleMotionSettings {...props} />
      </TabsContent>
    </Tabs>
  );
}
