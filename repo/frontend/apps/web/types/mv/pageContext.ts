export interface MvPageContextValue {
  isTheater: boolean;
  toggleTheater: () => void;
  /** 相似 MV 里的第一个，作为播放器的「下一个」；列表未就绪时为 null。 */
  nextId: number | null;
  onNextChange: (id: number | null) => void;
}
