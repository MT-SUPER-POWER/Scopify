import { logout } from "@/lib/api/login";
import { clearLoginStatus } from "@/lib/web/auth";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { devtools } from "zustand-devtools";
import { NeteasePlaylist } from "@/types/api/playlist";
import { SongDetail } from "@/types/api/music";

interface UserData {
  userId: number;
  nickname: string;
  avatarUrl: string;
  [key: string]: any;
}

type UserStore = {
  user: UserData | null;
  loginType: 'token' | 'cookie' | 'qr' | 'uid' | null;
  cookie: string;
  searchValue: string;
  searchType: number;
  collectedAlbumIds: Set<number>;
  likeListIDs: number[];
  playlist: NeteasePlaylist[];
  albumList: SongDetail[];

  handleLogout: () => Promise<void>;
  setUser: (userData: UserData) => void;
  setLoginType: (loginType: 'token' | 'cookie' | 'qr' | 'uid' | null) => void;
  setCookie: (cookie: string) => void;
  setAlbumList: (albumList: SongDetail[]) => void;
  setLikeListIDs: (ids: number[]) => void;
  setPlayList: (playlists: NeteasePlaylist[]) => void;
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
        likeListIDs: [],

        setUser: (userData: UserData) => set({ user: userData }),
        setLoginType: (loginType) => set({ loginType }),
        setCookie: (cookie) => {
          // 统一清洗逻辑：只保留核心的 MUSIC_U 字段，过滤掉冗余的 Path, Expires, Max-Age 等
          const musicUMatch = cookie.match(/MUSIC_U=([^;]+)/);
          const cleanCookie = musicUMatch ? `MUSIC_U=${musicUMatch[1]}` : cookie;
          set({ cookie: cleanCookie });
        },
        setAlbumList: (albumList: SongDetail[]) => set({ albumList }),
        setLikeListIDs: (ids) => set({ likeListIDs: ids }),
        setPlayList: (playlists) => set({ playlist: playlists }),
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
              // FIX: 登出时也清空喜欢列表
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
          cookie: state.cookie,
          // FIXME: 持久化 likeListIDs，刷新后不再丢失喜欢列表
          // OPTIMIZE: 后续可以做成除非有点击喜欢不然不变动，减少 localStorage 写入次数
          likeListIDs: state.likeListIDs,
        }),
      }
    )
  )
);
