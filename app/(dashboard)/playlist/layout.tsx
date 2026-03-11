import { Suspense } from "react";
import PlayListLoading from "./loading";
import PlaylistPageClient from "./PlaylistPageClient";

export default function PlaylistLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PlayListLoading />}>
      {/* <PlaylistPageClient /> */}
      {children}
    </Suspense>
  );
}
