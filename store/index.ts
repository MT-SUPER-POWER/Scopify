// 导入所有的 Store
import { usePlayerStore } from "./module/player";
import { useSearchStore } from "./module/search";
import { useUiStore } from "./module/ui";
import { useUserStore } from "./module/user";

// 默认导出 zustand
export { usePlayerStore, useSearchStore, useUiStore, useUserStore };
