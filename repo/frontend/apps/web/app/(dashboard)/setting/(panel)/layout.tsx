import { Suspense } from "react";

export default function SettingPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full px-6 pt-8 text-muted-foreground md:px-10">
      <Suspense fallback={null}>{children}</Suspense>
    </div>
  );
}
