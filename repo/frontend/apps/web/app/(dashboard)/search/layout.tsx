import { Suspense } from "react";
import { CategoryTabs } from "./_components/CategoryTabs";

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-full w-full max-w-400 p-6 pt-6 text-content">
      <Suspense fallback={null}>
        <CategoryTabs />
      </Suspense>
      {children}
    </div>
  );
}
