import { logout } from "@/lib/api/login";
import { clearLoginStatus } from "@/lib/web/auth";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { devtools } from "zustand-devtools";
import { NeteasePlaylist } from "@/types/api/playlist";

interface UserData {
  userId: number;
  nickName: string;
  [key: string]: any;
}

type UserStore = {
  user: UserData | null;
  loginType: 'token' | 'cookie' | 'qr' | 'uid' | null;
  cookie: string;
  searchValue: string;
  searchType: number;
  collectedAlbumIds: Set<number>;

  playlist: NeteasePlaylist[]; // 替换掉 any[]
  albumList: any[]; // 如果有 album 的 json，也应该像上面一样写个 interface

  handleLogout: () => Promise<void>;
  setUser: (userData: UserData) => void;
  setLoginType: (loginType: 'token' | 'cookie' | 'qr' | 'uid' | null) => void;
  setCookie: (cookie: string) => void;
}

export const useUserStore = create<UserStore>()(
  devtools(
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

        setUser: (userData: UserData) => set({ user: userData }),
        setLoginType: (loginType) => set({ loginType }),
        setCookie: (cookie) => set({ cookie }),
        handleLogout: async () => {
          try {
            await logout();
          } catch (error) {
            console.error('登出失败:', error);
          } finally {
            set({
              user: null,
              cookie: '',
              loginType: null,
              searchValue: '',
              searchType: 0,
              collectedAlbumIds: new Set(),
              playlist: [],
              albumList: [],
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
          cookie: state.cookie,
        }),
      }
    )
  )
);
