import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { logout } from "@/lib/api/login";
import { runtime } from "@/lib/runtime";
import { clearLoginStatus } from "@/lib/web/auth";
import { getBackendBaseUrl } from "@/lib/web/request";
import { pruneSongDetail, type RawSongDetail, type SongDetail } from "@/types/api/music";
import { type NeteasePlaylist, type RawNeteasePlaylist, prunePlaylist } from "@/types/api/playlist";
import type { NeteaseUserAlbum } from "@/types/api/release";
import { type NeteaseUser, type NeteaseUserSource, pruneUser } from "@/types/api/user";
import type { FollowedArtist } from "@/types/artist";

type UserStore = {
  user: NeteaseUser | null;
  loginType: "token" | "cookie" | "qr" | "uid" | null;
  searchValue: string;
  searchType: number;
  collectedAlbumIds: Set<number>;
  collectedAlbum: NeteaseUserAlbum[];
  likeListIDs: number[];
  playlist: NeteasePlaylist[];
  followedArtists: FollowedArtist[];
  albumList: SongDetail[];

  handleLogout: () => Promise<void>;
  clearSession: () => void;
  setUser: (userData: NeteaseUser | NeteaseUserSource | null | undefined) => void;
  setLoginType: (loginType: "token" | "cookie" | "qr" | "uid" | null) => void;
  setAlbumList: (albumList: RawSongDetail[] | SongDetail[]) => void;
  mergeSongStats: (songId: number, stats: { likedCount?: number; commentCount?: number }) => void;
  clearAlbumList: () => void;
  setCollectedAlbum: (albums: NeteaseUserAlbum[]) => void;
  setCollectedAlbumId: (albumId: number, collected: boolean) => void;
  clearCollectedAlbum: () => void;
  setLikeListIDs: (ids: number[]) => void;
  setPlayList: (playlists: RawNeteasePlaylist[]) => void;
  setFollowedArtists: (artists: FollowedArtist[]) => void;
  setUserId: (userId: number | string) => void;
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      loginType: null,
      searchValue: "",
      searchType: 0,
      collectedAlbumIds: new Set(),

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

      setUser: (userData: NeteaseUser | NeteaseUserSource | null | undefined) => {
        if (!userData) {
          set({ user: null });
          return;
        }
        const pruned = pruneUser(userData);
        if (!pruned.userId || pruned.userId <= 0) {
          set({ user: null });
          return;
        }
        set({ user: pruned });
      },
      setUserId: (userId: number | string) => {
        const numericUserId = Number(userId);
        if (!Number.isFinite(numericUserId) || numericUserId <= 0) return;
        set((state) =>
          state.user && state.user.userId > 0
            ? { user: { ...state.user, userId: numericUserId } }
            : state,
        );
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
      setPlayList: (rawPlaylists: RawNeteasePlaylist[]) => {
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
          await runtime.auth.clearMusicSession(getBackendBaseUrl());
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
      onRehydrateStorage: () => (state) => {
        if (state?.user) {
          const userId = Number(state.user.userId);
          const isUnknown =
            !state.user.nickname ||
            state.user.nickname === "未知用户" ||
            state.user.nickname === "未知使用者" ||
            state.user.nickname === "Unknown User";
          if (!Number.isFinite(userId) || userId <= 0 || isUnknown) {
            state.user = null;
            state.loginType = null;
          }
        }
      },
    },
  ),
);

if (runtime.isDesktop) {
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
