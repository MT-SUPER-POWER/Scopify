import { Suspense } from "react";
import PlayListLoading from "./loading";

export default function PlaylistLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PlayListLoading />}>
      {children}
    </Suspense>
  );
}
