
export interface NeteaseUserAlbum {
  subTime: number; // 收藏时间戳
  picUrl: string; // 专辑封面URL
  name: string; // 专辑名称
  size: number; // 专辑包含的歌曲数量
  id: number; // 专辑ID
}

export const pruneNeteaseUserAlbum = (album: NeteaseUserAlbum) => {
  return {
    subTime: album.subTime,
    picUrl: album.picUrl,
    name: album.name,
    size: album.size,
    id: album.id
  };
};
