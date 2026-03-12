// 导入所有的 Store
import { usePlayerStore } from "./module/player";
import { useUserStore } from "./module/user";
import { useUiStore } from './module/ui';

// 默认导出 zustand
export {
  usePlayerStore,
  useUserStore,
  useUiStore,
}
