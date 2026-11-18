import type { ReactNode } from "react";

export interface ProfileMenuProps {
  children?: ReactNode;
}

export interface ProfileMenuIdentityProps {
  isLoggedIn: boolean;
}

export interface ProfileMenuNavigationProps {
  isLoggedIn: boolean;
}
