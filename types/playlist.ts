export interface PlaylistInfo {
    isSpecial: boolean;
    privacy: string;
    tags: string[];
    title: string;
    cover: string | null;
    createTime: string;
    creator: string;
    creatorAvatar: string;
    likes: number | string;
    totalSongs: number;
}
