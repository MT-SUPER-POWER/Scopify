import { foliaGuidanceMessages } from "./folia/guidance";
import { foliaHomeMessages } from "./folia/home";
import { foliaIntegrationsMessages } from "./folia/integrations";
import { foliaLibraryMessages } from "./folia/library";
import { foliaLyricsMessages } from "./folia/lyrics";
import { foliaPlayerMessages } from "./folia/player";
import { foliaSettingsMessages } from "./folia/settings";
import { foliaSharedMessages } from "./folia/shared";

export const foliaMessages = {
  "zh-CN": {
    ...foliaSharedMessages["zh-CN"],
    ...foliaSettingsMessages["zh-CN"],
    ...foliaHomeMessages["zh-CN"],
    ...foliaLibraryMessages["zh-CN"],
    ...foliaPlayerMessages["zh-CN"],
    ...foliaLyricsMessages["zh-CN"],
    ...foliaIntegrationsMessages["zh-CN"],
    ...foliaGuidanceMessages["zh-CN"],
  },
  "zh-TW": {
    ...foliaSharedMessages["zh-TW"],
    ...foliaSettingsMessages["zh-TW"],
    ...foliaHomeMessages["zh-TW"],
    ...foliaLibraryMessages["zh-TW"],
    ...foliaPlayerMessages["zh-TW"],
    ...foliaLyricsMessages["zh-TW"],
    ...foliaIntegrationsMessages["zh-TW"],
    ...foliaGuidanceMessages["zh-TW"],
  },
  "en-US": {
    ...foliaSharedMessages["en-US"],
    ...foliaSettingsMessages["en-US"],
    ...foliaHomeMessages["en-US"],
    ...foliaLibraryMessages["en-US"],
    ...foliaPlayerMessages["en-US"],
    ...foliaLyricsMessages["en-US"],
    ...foliaIntegrationsMessages["en-US"],
    ...foliaGuidanceMessages["en-US"],
  },
} as const;
