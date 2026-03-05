////////////////////////////////////////////////////////////////////////////////////////
// 这个按钮是只有侧边栏最小化的时候才出现的
// 主要负责的工作就是：把原先过滤器放在了菜单里面
////////////////////////////////////////////////////////////////////////////////////////

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PanelLeftClose, Menu, PanelRightClose, Plus } from "lucide-react";
import { IconDisc, IconPlaylist, IconUsers } from '@tabler/icons-react';
import { cn } from "@/lib/utils";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleMenuSelect(item: string, panelAPI?: {
  collapse: () => void | undefined;
  expand: () => void | undefined;
}) {
  switch (item) {
    case "ENLARGE":
      panelAPI?.expand?.();
      break;
    case "COLLAPSE":
      panelAPI?.collapse?.();
      break;
    default:
      console.log(`Selected ${item}`)
      break;
  }
}

function handleFilterSelect(
  item: "ALL" | "PLAYLISTS" | "ARTISTS",
  dispatch: React.ActionDispatch<[action: { type: "ALL" | "PLAYLISTS" | "ARTISTS"; }]>
) {
  switch (item) {
    case "ALL":
      dispatch({ type: "ALL" });
      break;
    case "PLAYLISTS":
      dispatch({ type: "PLAYLISTS" });
      break;
    case "ARTISTS":
      dispatch({ type: "ARTISTS" });
      break;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ COMPONENTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function FilterMenu({
  panelAPI,
  filterHook
}: {
  panelAPI?: {
    collapse: () => void | undefined;
    expand: () => void | undefined;
  };
  filterHook: {
    state: 0 | 1 | 2;
    dispatch: React.ActionDispatch<[action: {
      type: "ALL" | "PLAYLISTS" | "ARTISTS";
    }]>;
  };
}) {

  const iconList = {
    "ALL": <IconDisc className="w-5 h-5 mr-2" />,
    "PLAYLISTS": <IconPlaylist className="w-5 h-5 mr-2" />,
    "ARTISTS": <IconUsers className="w-5 h-5 mr-2" />,

    "CREATE PLAYLISTS": <Plus className="w-5 h-5 mr-2" />,
    "ENLARGE": <PanelRightClose className="w-5 h-5 mr-2" />,
    "COLLAPSE": <PanelLeftClose className="w-5 h-5 mr-2" />
  }

  return (
    <DropdownMenu>

      {/* 最显示的 菜单栏按钮 */}
      <DropdownMenuTrigger asChild>
        {/* 增加了 focus:outline-none 和 focus-visible:ring-0 去除焦点白框 */}
        <button className={cn(
          "h-10 w-10 p-0 flex items-center justify-center shrink-0",
          "focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
        )}>
          <Menu className="w-5 h-5" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-full" align="start" side="right" sideOffset={14}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="dropdown-menu-label-momo mt-1">
            Filter
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(["ALL", "PLAYLISTS", "ARTISTS"] as const).map((item) => (
            <DropdownMenuItem key={item} onSelect={() => handleFilterSelect(item, filterHook.dispatch)}>
              {iconList[item]}
              <span>{item}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuGroup>
          <DropdownMenuLabel className="dropdown-menu-label-momo mt-1">
            PlayList
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(["CREATE PLAYLISTS", "ENLARGE"] as const).map((item) => (
            <DropdownMenuItem key={item} onSelect={() => handleMenuSelect(item, panelAPI)}>
              {iconList[item]}
              <span>{item}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu >
  )
}
