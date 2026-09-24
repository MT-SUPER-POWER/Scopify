import { ListMusic, PlayCircle, RadioTower, Search, Settings2, Sparkles } from "lucide-react";
import { ShortcutCommandIcon } from "@/components/shortcuts/ShortcutCommandIcon";
import type { CommandWorkspaceIconProps } from "@/types/commandWorkspace";

export function CommandWorkspaceIcon({ id }: CommandWorkspaceIconProps) {
  if (id.startsWith("personal-fm")) return <RadioTower className="size-4" />;
  if (id.startsWith("folia-mode-") || id === "folia-visualizers")
    return <Sparkles className="size-4" />;
  if (id.startsWith("folia-")) return <Settings2 className="size-4" />;
  if (id === "search") return <Search className="size-4" />;
  if (id === "now-playing") return <PlayCircle className="size-4" />;
  if (id === "queue") return <ListMusic className="size-4" />;
  if (id === "settings") return <Settings2 className="size-4" />;
  return <ShortcutCommandIcon commandId={id} />;
}
