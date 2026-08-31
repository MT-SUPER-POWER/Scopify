import { ListMusic, PlayCircle, Search, Settings2 } from "lucide-react";
import { ShortcutCommandIcon } from "@/components/shortcuts/ShortcutCommandIcon";
import type { CommandWorkspaceIconProps } from "@/types/commandWorkspace";

export function CommandWorkspaceIcon({ id }: CommandWorkspaceIconProps) {
  if (id === "search") return <Search className="size-4" />;
  if (id === "now-playing") return <PlayCircle className="size-4" />;
  if (id === "queue") return <ListMusic className="size-4" />;
  if (id === "settings") return <Settings2 className="size-4" />;
  return <ShortcutCommandIcon commandId={id} />;
}
