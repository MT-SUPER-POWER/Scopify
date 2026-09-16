import type { ReactNode } from "react";

export interface ProfileMenuProps {
  children?: ReactNode;
}

export interface ProfileMenuIdentityProps {
  isLoggedIn: boolean;
  onLogin: () => void;
}

export interface ProfileMenuNavigationProps {
  isLoggedIn: boolean;
}
