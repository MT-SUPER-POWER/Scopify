import { Loader2 } from "lucide-react";

export function ArtistLoading() {
  return (
    <div className="flex h-screen items-center justify-center p-8">
      <Loader2 className="size-8 animate-spin text-brand" />
    </div>
  );
}
