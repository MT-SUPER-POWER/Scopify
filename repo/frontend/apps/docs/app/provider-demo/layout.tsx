import type { ReactNode } from "react";

export default function ProviderDemoLayout({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-7xl space-y-8 px-5 py-10 md:px-8">{children}</main>;
}
