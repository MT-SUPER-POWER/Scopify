import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { logout } from "@/lib/api/login";
import { IS_ELECTRON } from "@/lib/utils";
import { clearLoginStatus } from "@/lib/web/auth";
import { pruneSongDetail, type RawSongDetail, type SongDetail } from "@/types/api/music";
import { type NeteasePlaylist, prunePlaylist } from "@/types/api/playlist";
import type { NeteaseUserAlbum } from "@/types/api/release";
import { type NeteaseUser, pruneUser } from "@/types/api/user";
import type { FollowedArtist } from "@/types/artist";

type UserStore = {
  user: NeteaseUser | null;
  loginType: "token" | "cookie" | "qr" | "uid" | null;
  searchValue: string;
  searchType: number;
  libraryUpdateTrigger: number;
  collectedAlbumIds: Set<number>;
  collectedAlbum: NeteaseUserAlbum[];
  likeListIDs: number[];
  playlist: NeteasePlaylist[];
  followedArtists: FollowedArtist[];
  albumList: SongDetail[];

  handleLogout: () => Promise<void>;
  clearSession: () => void;
  setUser: (userData: NeteaseUser) => void;
  setLoginType: (loginType: "token" | "cookie" | "qr" | "uid" | null) => void;
  setAlbumList: (albumList: RawSongDetail[] | SongDetail[]) => void;
  mergeSongStats: (songId: number, stats: { likedCount?: number; commentCount?: number }) => void;
  clearAlbumList: () => void;
  setCollectedAlbum: (albums: NeteaseUserAlbum[]) => void;
  setCollectedAlbumId: (albumId: number, collected: boolean) => void;
  clearCollectedAlbum: () => void;
  setLikeListIDs: (ids: number[]) => void;
  setPlayList: (playlists: NeteasePlaylist[]) => void;
  setFollowedArtists: (artists: FollowedArtist[]) => void;
  setUserId: (userId: number | string) => void;
  triggerLibraryUpdate: () => void;
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      loginType: null,
      cookie: "",
      searchValue: "",
      searchType: 0,
      collectedAlbumIds: new Set(),
      libraryUpdateTrigger: 0,

      playlist: [],
      followedArtists: [],
      albumList: [],
      likeListIDs: [],
      collectedAlbum: [],
      setCollectedAlbum: (albums: NeteaseUserAlbum[]) =>
        set({
          collectedAlbum: albums,
          collectedAlbumIds: new Set(albums.map((album) => album.id)),
        }),
      setCollectedAlbumId: (albumId: number, collected: boolean) =>
        set((state) => {
          const nextIds = new Set(state.collectedAlbumIds);
          if (collected) {
            nextIds.add(albumId);
          } else {
            nextIds.delete(albumId);
          }
          return { collectedAlbumIds: nextIds };
        }),
      clearCollectedAlbum: () => set({ collectedAlbum: [], collectedAlbumIds: new Set() }),

      triggerLibraryUpdate: () =>
        set((state) => ({ libraryUpdateTrigger: state.libraryUpdateTrigger + 1 })),
      setUser: (userData: NeteaseUser) => set({ user: pruneUser(userData) }),
      setUserId: (userId: number | string) => {
        set({ user: { ...useUserStore.getState().user, id: userId } as NeteaseUser });
      },
      setLoginType: (loginType: "token" | "cookie" | "qr" | "uid" | null) => set({ loginType }),
      setAlbumList: (albumList: RawSongDetail[] | SongDetail[]) => {
        const cleanAlbumList = albumList.map(pruneSongDetail);
        set({ albumList: cleanAlbumList });
      },
      mergeSongStats: (songId, stats) =>
        set((state) => ({
          albumList: state.albumList.map((song) =>
            song.id === songId ? { ...song, ...stats } : song,
          ),
        })),
      clearAlbumList: () => set({ albumList: [] }),
      setLikeListIDs: (ids: number[]) => set({ likeListIDs: ids }),
      setPlayList: (rawPlaylists: NeteasePlaylist[]) => {
        const cleanPlaylists = rawPlaylists.map(prunePlaylist);
        set({ playlist: cleanPlaylists });
      },
      setFollowedArtists: (artists: FollowedArtist[]) => set({ followedArtists: artists }),
      clearSession: () => {
        set({
          user: null,
          loginType: null,
          searchValue: "",
          searchType: 0,
          collectedAlbumIds: new Set(),
          playlist: [],
          followedArtists: [],
          albumList: [],
          likeListIDs: [],
        });
        clearLoginStatus();
      },
      handleLogout: async () => {
        try {
          await logout();
        } catch (error) {
          console.error("登出失败:", error);
        } finally {
          useUserStore.getState().clearSession();
          window.location.reload();
        }
      },
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        loginType: state.loginType,
        likeListIDs: state.likeListIDs,
      }),
    },
  ),
);

if (IS_ELECTRON) {
  window.addEventListener("storage", (e) => {
    if (e.key === "user-storage" && e.newValue) {
      try {
        const newState = JSON.parse(e.newValue);
        if (newState?.state) {
          useUserStore.setState(newState.state);
        }
      } catch (error) {
        console.error("同步跨窗口 UserStore 状态失败", error);
      }
    }
  });
}
