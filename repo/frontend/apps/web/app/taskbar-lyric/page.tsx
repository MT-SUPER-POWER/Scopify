import type { Metadata } from "next";

import { TaskbarLyricView } from "@/components/lyrics/taskbar/TaskbarLyricView";

export const metadata: Metadata = {
  title: "Scopify Taskbar Lyric",
};

export default function TaskbarLyricPage() {
  return (
    <main className="size-full bg-transparent">
      <TaskbarLyricView />
    </main>
  );
}
