'use client';

import { usePathname } from 'next/navigation';
import MainLayout from "../components/MainLayout";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTATNS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const noAuthPages = ['/login', '/tray'];

export default function RootLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isNoAuthPage = noAuthPages.includes(pathname);

  if (isNoAuthPage) {
    return <>{children}</>;
  }

  return <MainLayout>{children}</MainLayout>;
}
