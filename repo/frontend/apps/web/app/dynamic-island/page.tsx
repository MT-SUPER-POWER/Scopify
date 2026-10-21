import type { Metadata } from "next";

import { DynamicIslandView } from "@/components/lyrics/island/DynamicIslandView";

export const metadata: Metadata = {
  title: "Scopify Dynamic Island",
};

export default function DynamicIslandPage() {
  return (
    <main className="size-full bg-transparent">
      <DynamicIslandView />
    </main>
  );
}
