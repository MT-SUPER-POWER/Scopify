import { clearLoginStatus } from "@/lib/web/auth";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UserData {
  userId: number;
  [key: string]: any;
}

type UserStore = {
  user: UserData | null;
  loginType: 'token' | 'cookie' | 'qr' | 'uid' | null;
  searchValue: string;
  searchType: number;
  collectedAlbumIds: Set<number>;
  playlist: any[];
  albumList: any[];

  handleLogout: () => Promise<void>;
  setUser: (userData: UserData) => void;
  setLoginType: (loginType: 'token' | 'cookie' | 'qr' | 'uid' | null) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      loginType: null,
      searchValue: '',
      searchType: 0,
      collectedAlbumIds: new Set(),
      playlist: [],
      albumList: [],

      handleLogout: async () => {
        // 清空 Store 存储的数据
        set({
          user: null,
          loginType: null,
          searchValue: '',
          searchType: 0,
          collectedAlbumIds: new Set(),
          playlist: [],
          albumList: [],
        });
        // 清空浏览器缓存
        clearLoginStatus();
        window.location.reload();   // 刷新
      },

      setUser: (userData) => { set({ user: userData }) },
      setLoginType: (loginType) => { set({ loginType }) },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        loginType: state.loginType,
      }),
    }
  )
)
