/** native/taskbar-lyric 暴露给 Main 的 NAPI 接口（与 Rust 侧 #[napi] 声明保持一致）。 */

export interface TaskbarNativeRect {
  height: number;
  width: number;
  x: number;
  y: number;
}

export interface TaskbarNativeLayout {
  extra: {
    isCentered: boolean;
    isLight: boolean;
    systemType: string;
  };
  /** 物理像素，相对任务栏窗口左上角。 */
  space: { left: TaskbarNativeRect; right: TaskbarNativeRect };
}

export interface TaskbarNativeWatcher {
  stop(): void;
}

export interface TaskbarNativeService {
  embedWindowByPtr(hwndPtr: number): void;
  reinit(): void;
  stop(): void;
  update(lyricWidth: number): void;
}

export interface TaskbarLyricNativeModule {
  RegistryWatcher: new (subKey: string, callback: () => void) => TaskbarNativeWatcher;
  TaskbarCreatedWatcher: new (callback: () => void) => TaskbarNativeWatcher;
  TaskbarService: new (callback: (layout: TaskbarNativeLayout) => void) => TaskbarNativeService;
  TrayWatcher: new (callback: () => void) => TaskbarNativeWatcher;
  UiaWatcher: new (callback: () => void) => TaskbarNativeWatcher;
}
