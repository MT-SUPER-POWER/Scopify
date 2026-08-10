import { commonMessages } from "./common";
import { settingsMessages } from "./settings";
import { appCloseMessages } from "./appClose";
import { layoutMessages } from "./layout";
import { contextMenuMessages } from "./contextMenu";
import { loginMessages } from "./login";
import { sidebarMessages } from "./sidebar";
import { playlistMessages } from "./playlist";
import { searchMessages } from "./search";
import { commentsMessages } from "./comments";
import { queueMessages } from "./queue";
import { profileMessages } from "./profile";
import { vipSignMessages } from "./vipSign";
import { albumMessages } from "./album";
import { artistMessages } from "./artist";
import { homeMessages } from "./home";
import { networkMessages } from "./network";
import { trayMessages } from "./tray";
import { playbarMessages } from "./playbar";
import { lyricsMessages } from "./lyrics";
import { uiMessages } from "./ui";
import { playerBarMessages } from "./playerBar";
import { desktopLyricsMessages } from "./desktopLyrics";
import { desktopPlaybackControllerMessages } from "./desktopPlaybackController";
import { foliaMessages } from "./folia";
import { shortcutsMessages } from "./shortcuts";
import { libraryMessages } from "./library";
import { updaterMessages } from "./updater";

export const messages = {
  "zh-CN": {
    ...commonMessages["zh-CN"],
    ...settingsMessages["zh-CN"],
    ...appCloseMessages["zh-CN"],
    ...layoutMessages["zh-CN"],
    ...contextMenuMessages["zh-CN"],
    ...loginMessages["zh-CN"],
    ...sidebarMessages["zh-CN"],
    ...playlistMessages["zh-CN"],
    ...searchMessages["zh-CN"],
    ...commentsMessages["zh-CN"],
    ...queueMessages["zh-CN"],
    ...profileMessages["zh-CN"],
    ...vipSignMessages["zh-CN"],
    ...albumMessages["zh-CN"],
    ...artistMessages["zh-CN"],
    ...homeMessages["zh-CN"],
    ...networkMessages["zh-CN"],
    ...trayMessages["zh-CN"],
    ...playbarMessages["zh-CN"],
    ...lyricsMessages["zh-CN"],
    ...uiMessages["zh-CN"],
    ...playerBarMessages["zh-CN"],
    ...desktopLyricsMessages["zh-CN"],
    ...desktopPlaybackControllerMessages["zh-CN"],
    ...foliaMessages["zh-CN"],
    ...shortcutsMessages["zh-CN"],
    ...libraryMessages["zh-CN"],
    ...updaterMessages["zh-CN"],
  },
  "zh-TW": {
    ...commonMessages["zh-TW"],
    ...settingsMessages["zh-TW"],
    ...appCloseMessages["zh-TW"],
    ...layoutMessages["zh-TW"],
    ...contextMenuMessages["zh-TW"],
    ...loginMessages["zh-TW"],
    ...sidebarMessages["zh-TW"],
    ...playlistMessages["zh-TW"],
    ...searchMessages["zh-TW"],
    ...commentsMessages["zh-TW"],
    ...queueMessages["zh-TW"],
    ...profileMessages["zh-TW"],
    ...vipSignMessages["zh-TW"],
    ...albumMessages["zh-TW"],
    ...artistMessages["zh-TW"],
    ...homeMessages["zh-TW"],
    ...networkMessages["zh-TW"],
    ...trayMessages["zh-TW"],
    ...playbarMessages["zh-TW"],
    ...lyricsMessages["zh-TW"],
    ...uiMessages["zh-TW"],
    ...playerBarMessages["zh-TW"],
    ...desktopLyricsMessages["zh-TW"],
    ...desktopPlaybackControllerMessages["zh-TW"],
    ...foliaMessages["zh-TW"],
    ...shortcutsMessages["zh-TW"],
    ...libraryMessages["zh-TW"],
    ...updaterMessages["zh-TW"],
  },
  "en-US": {
    ...commonMessages["en-US"],
    ...settingsMessages["en-US"],
    ...appCloseMessages["en-US"],
    ...layoutMessages["en-US"],
    ...contextMenuMessages["en-US"],
    ...loginMessages["en-US"],
    ...sidebarMessages["en-US"],
    ...playlistMessages["en-US"],
    ...searchMessages["en-US"],
    ...commentsMessages["en-US"],
    ...queueMessages["en-US"],
    ...profileMessages["en-US"],
    ...vipSignMessages["en-US"],
    ...albumMessages["en-US"],
    ...artistMessages["en-US"],
    ...homeMessages["en-US"],
    ...networkMessages["en-US"],
    ...trayMessages["en-US"],
    ...playbarMessages["en-US"],
    ...lyricsMessages["en-US"],
    ...uiMessages["en-US"],
    ...playerBarMessages["en-US"],
    ...desktopLyricsMessages["en-US"],
    ...desktopPlaybackControllerMessages["en-US"],
    ...foliaMessages["en-US"],
    ...shortcutsMessages["en-US"],
    ...libraryMessages["en-US"],
    ...updaterMessages["en-US"],
  },
} as const;
