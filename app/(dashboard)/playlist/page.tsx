import PlaylistPageClient from "./PlaylistPageClient";
import { Suspense } from "react";

export default function PlaylistPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlaylistPageClient />
    </Suspense>
  );
}
