import { logout } from "@/lib/api/login";
import { clearLoginStatus } from "@/lib/web/auth";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { NeteasePlaylist, prunePlaylist } from "@/types/api/playlist";
import { pruneSongDetail, SongDetail } from "@/types/api/music";
import { NeteaseUser, pruneUser } from "@/types/api/user";


type UserStore = {
  user: NeteaseUser | null;
  loginType: 'token' | 'cookie' | 'qr' | 'uid' | null;
  searchValue: string;
  searchType: number;
  collectedAlbumIds: Set<number>;
  likeListIDs: number[];
  playlist: NeteasePlaylist[];
  albumList: SongDetail[];

  handleLogout: () => Promise<void>;
  setUser: (userData: any) => void;
  setLoginType: (loginType: 'token' | 'cookie' | 'qr' | 'uid' | null) => void;
  setAlbumList: (albumList: any[]) => void;
  setLikeListIDs: (ids: number[]) => void;
  setPlayList: (playlists: NeteasePlaylist[]) => void;
  setUserId: (userId: number | string) => void;
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
      playlist: [],
      albumList: [],
      likeListIDs: [],

      setUser: (userData: any) => set({ user: pruneUser(userData) }),
      setUserId: (userId) => {
        set({ user: { ...useUserStore.getState().user, id: userId } as NeteaseUser });
      },
      setLoginType: (loginType) => set({ loginType }),
      setAlbumList: (albumList: any[]) => {
        const cleanAlbumList = albumList.map(pruneSongDetail);
        set({ albumList: cleanAlbumList });
      },
      setLikeListIDs: (ids: number[]) => set({ likeListIDs: ids }),
      setPlayList: (rawPlaylists: any[]) => {
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
