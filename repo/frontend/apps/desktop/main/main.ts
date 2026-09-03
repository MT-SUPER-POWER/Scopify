/**
 * Electron Main 进程入口。
 *
 * 所有启动顺序、窗口组装与退出清理都集中在 core；入口保持无业务逻辑，方便维护者
 * 从一个稳定位置进入应用生命周期。
 */
import { initializeApplication } from "./core/index.js";

initializeApplication();
