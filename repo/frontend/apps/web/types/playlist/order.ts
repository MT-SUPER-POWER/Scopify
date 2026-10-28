export interface InlineOrderMove {
  playlistId?: string;
  fromId: number;
  toId: number;
  expectedIds: number[];
}

export interface InlineOrderDraft<T> {
  base: T[];
  items: T[];
  scope: string;
}
