import { Suspense } from "react";

export default function SocialLayout({ children }: { children: React.ReactNode }) {
  return <Suspense>{children}</Suspense>;
}
