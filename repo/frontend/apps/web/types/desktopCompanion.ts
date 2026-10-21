export interface CompanionWindowDragOptions {
  /** 锁定等状态下不响应拖拽。 */
  disabled: boolean;
  /** 命中这些元素时不开始拖拽，默认排除按钮、链接与输入框。 */
  ignoreSelector?: string;
  /** 拖拽中按屏幕坐标移动窗口左上角。 */
  onMove: (x: number, y: number) => void;
  /** 松手后持久化位置。 */
  onEnd: () => void;
}
