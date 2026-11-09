/** A lyric variant returned by NetEase's `/lyric/new` endpoint. */
export interface NeteaseLyricBranchDto {
  version: number;
  lyric: string | null;
  pureMusic?: boolean;
  [key: string]: unknown;
}

/** A NetEase user credited for a lyric or its translation. */
export interface NeteaseLyricUserDto {
  id: number;
  status: number;
  demand: number;
  userid: number;
  nickname: string;
  uptime: number;
  [key: string]: unknown;
}

/**
 * Raw response from NetEase's `/lyric/new` endpoint. New fields are occasionally introduced
 * upstream, so the index signature keeps them until an adapter chooses to consume them.
 */
export interface NeteaseLyricDto {
  sgc?: boolean; // 歌词是否由系统自动生成（非人工上传）
  sfy?: boolean; // 歌词是否与歌曲匹配/适配
  qfy?: boolean; // 歌词质量是否达标
  pureMusic?: boolean;
  transUser?: NeteaseLyricUserDto; // 翻译者
  lyricUser?: NeteaseLyricUserDto; // 原词作者
  lrc?: NeteaseLyricBranchDto; // 原文歌词（LRC 格式）
  klyric?: NeteaseLyricBranchDto; // 逐字歌词（卡拉OK）
  tlyric?: NeteaseLyricBranchDto; // 翻译歌词
  romalrc?: NeteaseLyricBranchDto; // 罗马音歌词
  yrc?: NeteaseLyricBranchDto; // 逐字原文歌词（YRC 格式）
  ytlrc?: NeteaseLyricBranchDto; // 逐字翻译歌词
  yromalrc?: NeteaseLyricBranchDto; // 逐字罗马音歌词
  code: number;
  [key: string]: unknown;
}
