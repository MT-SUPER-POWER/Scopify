import { COMMAND_WORKSPACE_NAVIGATION_ICONS } from "@/constants/commandWorkspaceNavigation";
import { getFoliaCommandIcon } from "@/constants/foliaCommandIcons";
import {
  ListMusic,
  Gauge,
  Languages,
  PlayCircle,
  Power,
  RectangleEllipsis,
  Search,
  Settings2,
  SunMoon,
} from "lucide-react";
import { ShortcutCommandIcon } from "@/components/shortcuts/ShortcutCommandIcon";
import type { CommandWorkspaceIconProps } from "@/types/commandWorkspace/model";

export function CommandWorkspaceIcon({ id }: CommandWorkspaceIconProps) {
  const NavigationIcon = COMMAND_WORKSPACE_NAVIGATION_ICONS.get(id);
  if (NavigationIcon) return <NavigationIcon className="size-4" aria-hidden />;
  if (id.startsWith("setting:language:")) return <Languages className="size-4" aria-hidden />;
  if (id.startsWith("setting:progress:")) return <Gauge className="size-4" aria-hidden />;
  if (id.startsWith("setting:appearance:")) return <SunMoon className="size-4" aria-hidden />;
  if (id === "theme" || id === "toggle-app-theme")
    return <SunMoon className="size-4" aria-hidden />;
  if (id.startsWith("personal-fm") || id.startsWith("folia-")) {
    const Icon = getFoliaCommandIcon(id);
    return <Icon className="size-4 text-content" aria-hidden />;
  }
  if (id === "search") return <Search className="size-4" />;
  if (id === "now-playing") return <PlayCircle className="size-4" />;
  if (id === "queue") return <ListMusic className="size-4" />;
  if (id === "settings") return <Settings2 className="size-4" />;
  if (id === "dynamic-island") return <RectangleEllipsis className="size-4" />;
  if (id === "exit-app") return <Power className="size-4" />;
  return <ShortcutCommandIcon commandId={id} />;
}
