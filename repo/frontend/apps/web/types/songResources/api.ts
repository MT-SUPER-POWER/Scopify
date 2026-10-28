export interface SongWikiElement {
  title?: string;
  content?: string;
  wikiSubMetaVos?: { text?: string }[];
}
export interface SongWikiBlock {
  blockCode?: string;
  blockInfo?: {
    blockName?: string;
    desc?: string;
    wikiSubElementVos?: SongWikiElement[];
  };
}
export interface SongWikiResponse {
  code: number;
  data: { blocks: { bizCode?: string; rnData?: { blocks?: SongWikiBlock[] } }[] };
}
export interface MusicSheet {
  id: number;
  name: string;
  coverImageUrl?: string;
  type?: { code: number; name: string }[];
  totalPageSize?: number;
  difficulty?: string;
  musicKey?: string;
  playVersion?: string;
  chordName?: string;
  bpm?: number;
  sourceDesc?: string;
}
export interface SongSheetListResponse {
  code: number;
  data: { musicSheetSimpleInfoVOS: MusicSheet[]; errorCode?: number | null };
}
/** The anonymous endpoint returns an empty array; validate page records before rendering. */
export interface SheetPreviewResponse {
  code: number;
  data: unknown;
}
