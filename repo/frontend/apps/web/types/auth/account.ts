import type { MusicProvider } from "@scopify/music-domain/identity";

/** The signed-in account of one platform, as the account menu shows it. */
export interface ProviderAccountProfile {
  provider: MusicProvider;
  accountId: string;
  nickname: string;
  avatarUrl?: string;
}

/** One platform's login state for the account switcher. */
export interface ProviderAccountState {
  provider: MusicProvider;
  isLoggedIn: boolean;
  /** Missing while signed out, or while a signed-in QQ profile is still loading. */
  profile?: ProviderAccountProfile;
}
