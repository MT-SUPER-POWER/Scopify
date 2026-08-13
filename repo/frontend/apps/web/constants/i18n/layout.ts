import { defineMessages } from "./define";

export const layoutMessages = defineMessages(
  {
    "layout.startingTitle": "正在启动本地服务",
    "layout.startingDescription": "Scopify 正在等待 Electron 后端就绪，完成后会自动进入。",
    "layout.failedTitle": "本地服务启动失败",
    "layout.failedDescription": "后端未能按预期启动，请重启应用后再试。",
    "layout.restartApp": "重新启动应用",
  },
  {
    "layout.startingTitle": "正在啟動本地服務",
    "layout.startingDescription": "Scopify 正在等待 Electron 後端就緒，完成後會自動進入。",
    "layout.failedTitle": "本地服務啟動失敗",
    "layout.failedDescription": "後端未能按預期啟動，請重新啟動應用後再試。",
    "layout.restartApp": "重新啟動應用",
  },
  {
    "layout.startingTitle": "Starting Local Service",
    "layout.startingDescription": "Scopify is waiting for the Electron backend to become ready.",
    "layout.failedTitle": "Local Service Failed to Start",
    "layout.failedDescription":
      "The backend did not start as expected. Please restart the app and try again.",
    "layout.restartApp": "Restart Application",
  },
);
