import { defineMessages } from "./define";

export const appearanceBulkMessages = defineMessages(
  {
    "appearance.bulk.manage": "管理",
    "appearance.bulk.done": "完成",
    "appearance.bulk.all": "全选",
    "appearance.bulk.selected": "已选 {{count}} 项",
    "appearance.bulk.delete": "删除 {{count}} 个主题",
    "appearance.bulk.confirmTitle": "删除选中的 {{count}} 个主题？",
    "appearance.bulk.confirmHint": "删除后无法恢复。内置主题不受影响。",
    "appearance.bulk.activeFixed": "当前正在使用的主题也在其中，删除后将应用雾银。",
    "appearance.bulk.activeRotation": "当前轮换中的主题也在其中，删除后会按更新后的计划切换。",
    "appearance.bulk.daily": "其中 {{count}} 个主题将移出每日轮换；若列表清空，将使用雾银。",
    "appearance.bulk.slots": "有 {{count}} 个时段引用了这些主题，将替换为雾银，保留原有时间安排。",
  },
  {
    "appearance.bulk.manage": "管理",
    "appearance.bulk.done": "完成",
    "appearance.bulk.all": "全選",
    "appearance.bulk.selected": "已選 {{count}} 項",
    "appearance.bulk.delete": "刪除 {{count}} 個主題",
    "appearance.bulk.confirmTitle": "刪除選取的 {{count}} 個主題？",
    "appearance.bulk.confirmHint": "刪除後無法復原。內建主題不受影響。",
    "appearance.bulk.activeFixed": "目前使用的主題也在其中，刪除後將套用霧銀。",
    "appearance.bulk.activeRotation": "目前輪替中的主題也在其中，刪除後會依更新後的計畫切換。",
    "appearance.bulk.daily": "其中 {{count}} 個主題將移出每日輪替；若清單清空，將使用霧銀。",
    "appearance.bulk.slots": "有 {{count}} 個時段引用了這些主題，將替換為霧銀，保留原有時間安排。",
  },
  {
    "appearance.bulk.manage": "Manage",
    "appearance.bulk.done": "Done",
    "appearance.bulk.all": "Select all",
    "appearance.bulk.selected": "{{count}} selected",
    "appearance.bulk.delete": "Delete {{count}} themes",
    "appearance.bulk.confirmTitle": "Delete {{count}} selected themes?",
    "appearance.bulk.confirmHint": "This cannot be undone. Built-in themes are unaffected.",
    "appearance.bulk.activeFixed":
      "Your active theme is selected. Silver will be applied after deletion.",
    "appearance.bulk.activeRotation":
      "The active rotation theme is selected. The updated rotation will take effect.",
    "appearance.bulk.daily":
      "{{count}} themes will be removed from daily rotation. If none remain, Silver will be used.",
    "appearance.bulk.slots":
      "{{count}} time periods reference these themes. They will use Silver; their times are preserved.",
  },
);
