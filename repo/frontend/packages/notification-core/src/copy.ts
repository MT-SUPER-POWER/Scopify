import type { NotificationLocale, NotificationSource } from "@scopify/desktop-contract";

const copy = {
  "zh-CN": {
    private: "新私信",
    comments: "收到评论",
    mentions: "有人提到了你",
    notices: "平台通知",
    daily: "今日听歌回顾",
    weekly: "本期听歌周报",
    yearly: "年度听歌报告",
    ready: "报告已就绪，展开查看摘要。",
    message: "收到一条新消息，展开查看摘要。",
    test: "桌面通知已开启",
    testBody: "新的消息和听歌报告将在这里提醒你。",
    count: "首歌曲",
    until: "截至",
  },
  "zh-TW": {
    private: "新私訊",
    comments: "收到評論",
    mentions: "有人提到了你",
    notices: "平台通知",
    daily: "今日聽歌回顧",
    weekly: "本期聽歌週報",
    yearly: "年度聽歌報告",
    ready: "報告已就緒，展開查看摘要。",
    message: "收到一則新訊息，展開查看摘要。",
    test: "桌面通知已開啟",
    testBody: "新的訊息和聽歌報告將在這裡提醒你。",
    count: "首歌曲",
    until: "截至",
  },
  "en-US": {
    private: "New message",
    comments: "New comment",
    mentions: "You were mentioned",
    notices: "Service notice",
    daily: "Today's listening recap",
    weekly: "Your weekly listening report",
    yearly: "Your yearly listening report",
    ready: "Your report is ready. Expand to see a summary.",
    message: "You have a new message. Expand to see a summary.",
    test: "Desktop notifications enabled",
    testBody: "New messages and listening reports will appear here.",
    count: "songs",
    until: "As of",
  },
};

export function notificationCopy(locale: NotificationLocale) {
  return copy[locale];
}
export function notificationTitle(source: NotificationSource, locale: NotificationLocale) {
  return copy[locale][source];
}
