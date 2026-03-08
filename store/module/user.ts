import { clearLoginStatus } from "@/lib/web/auth";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";


interface UserData {
  userId: number;       // uid 一定要存储下来
  arUrl: string;        // 头像
  nickName: string;      // 昵称
  [key: string]: any;   // 其他用户信息字段，根据需要添加
}

type UserStore = {
  user: UserData | null;
  loginType: 'token' | 'cookie' | 'qr' | 'uid' | null;
  cookie: string;
  searchValue: string;
  searchType: number;
  collectedAlbumIds: Set<number>;
  playlist: any[];
  albumList: any[];

  handleLogout: () => Promise<void>;
  setUser: (userData: UserData) => void;
  setLoginType: (loginType: 'token' | 'cookie' | 'qr' | 'uid' | null) => void;
  setCookie: (cookie: string) => void;
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
      setCookie: (cookie) => { set({ cookie }) },
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
