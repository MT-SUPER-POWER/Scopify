import { logout } from "@/lib/api/login";
import { clearLoginStatus } from "@/lib/web/auth";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { NeteasePlaylist, prunePlaylist } from "@/types/api/playlist";
import { pruneSongDetail, RawSongDetail, SongDetail } from "@/types/api/music";
import { NeteaseUser, pruneUser } from "@/types/api/user";
import { NeteaseUserAlbum } from "@/types/api/release";
import { IS_ELECTRON } from "@/lib/utils";

type UserStore = {
  user: NeteaseUser | null;
  loginType: 'token' | 'cookie' | 'qr' | 'uid' | null;
  searchValue: string;
  searchType: number;
  libraryUpdateTrigger: number;
  collectedAlbumIds: Set<number>;
  collectedAlbum: NeteaseUserAlbum[];
  likeListIDs: number[];
  playlist: NeteasePlaylist[];
  albumList: SongDetail[];

  handleLogout: () => Promise<void>;
  setUser: (userData: NeteaseUser) => void;
  setLoginType: (loginType: 'token' | 'cookie' | 'qr' | 'uid' | null) => void;
  setAlbumList: (albumList: RawSongDetail[] | SongDetail[]) => void;
  clearAlbumList: () => void;
  setCollectedAlbum: (albums: NeteaseUserAlbum[]) => void;
  clearCollectedAlbum: () => void;
  setLikeListIDs: (ids: number[]) => void;
  setPlayList: (playlists: NeteasePlaylist[]) => void;
  setUserId: (userId: number | string) => void;
  triggerLibraryUpdate: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      loginType: null,
      cookie: '',
      searchValue: '',
      searchType: 0,
      collectedAlbumIds: new Set(),
      libraryUpdateTrigger: 0,

      playlist: [],
      albumList: [],
      likeListIDs: [],
      collectedAlbum: [],
      setCollectedAlbum: (albums: NeteaseUserAlbum[]) => set({ collectedAlbum: albums }),
      clearCollectedAlbum: () => set({ collectedAlbum: [] }),

      triggerLibraryUpdate: () => set((state) => ({ libraryUpdateTrigger: state.libraryUpdateTrigger + 1 })),
      setUser: (userData: NeteaseUser) => set({ user: pruneUser(userData) }),
      setUserId: (userId: number | string) => {
        set({ user: { ...useUserStore.getState().user, id: userId } as NeteaseUser });
      },
      setLoginType: (loginType: 'token' | 'cookie' | 'qr' | 'uid' | null) => set({ loginType }),
      setAlbumList: (albumList: RawSongDetail[] | SongDetail[]) => {
        const cleanAlbumList = albumList.map(pruneSongDetail);
        set({ albumList: cleanAlbumList });
      },
      clearAlbumList: () => set({ albumList: [] }),
      setLikeListIDs: (ids: number[]) => set({ likeListIDs: ids }),
      setPlayList: (rawPlaylists: NeteasePlaylist[]) => {
        const cleanPlaylists = rawPlaylists.map(prunePlaylist);
        set({ playlist: cleanPlaylists });
      },
      handleLogout: async () => {
        try { await logout(); }
        catch (error) {
          console.error('登出失败:', error);
        } finally {
          set({
            user: null,
            loginType: null,
            searchValue: '',
            searchType: 0,
            collectedAlbumIds: new Set(),
            playlist: [],
            albumList: [],
            likeListIDs: [],
          });
          clearLoginStatus();
          window.location.reload();
        }
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        loginType: state.loginType,
        likeListIDs: state.likeListIDs,
      }),
    }
  )
);

if (IS_ELECTRON) {
  window.addEventListener("storage", (e) => {
    if (e.key === "user-storage" && e.newValue) {
      try {
        const newState = JSON.parse(e.newValue);
        if (newState && newState.state) {
          useUserStore.setState(newState.state);
        }
      } catch (error) {
        console.error("同步跨窗口 UserStore 状态失败", error);
      }
    }
  });
}
