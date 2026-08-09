////////////////////////////////////////////////////////////////////////////////////////
// 这个按钮是只有侧边栏最小化的时候才出现的
// 主要负责的工作就是：把原先过滤器放在了菜单里面
////////////////////////////////////////////////////////////////////////////////////////

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { IconDisc, IconPlaylist } from "@tabler/icons-react";
import { Bell, Menu, PanelLeftClose, PanelRightClose, Plus, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { FilterAction, FilterState } from "@/types/components/Siderbar";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTANTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const stateToType: Record<FilterState, FilterAction["type"]> = {
  0: "ALL",
  1: "CREATED",
  2: "SUBSCRIBED",
  3: "ARTISTS",
};
const FILTER_TYPES: FilterAction["type"][] = ["ALL", "CREATED", "SUBSCRIBED", "ARTISTS"];

function isFilterType(value: string): value is FilterAction["type"] {
  return FILTER_TYPES.some((type) => type === value);
}

const iconList = {
  ALL: <IconDisc className="mr-2 size-5" />,
  CREATED: <IconPlaylist className="mr-2 size-5" />,
  SUBSCRIBED: <Bell className="mr-2 size-5" />,
  ARTISTS: <User className="mr-2 size-5" />,

  ENLARGE: <PanelRightClose className="mr-2 size-5" />,
  COLLAPSE: <PanelLeftClose className="mr-2 size-5" />,
  FAVORITES: <IconDisc className="text-warning mr-2 size-5" />,
  "CREATE PLAYLISTS": <Plus className="mr-2 size-5" />,
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleFilterSelect(
  item: FilterAction,
  dispatch: React.ActionDispatch<[action: FilterAction]>,
) {
  switch (item.type) {
    case "ALL":
      dispatch({ type: "ALL" });
      break;
    case "CREATED":
      dispatch({ type: "CREATED" });
      break;
    case "SUBSCRIBED":
      dispatch({ type: "SUBSCRIBED" });
      break;
    case "ARTISTS":
      dispatch({ type: "ARTISTS" });
      break;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ COMPONENTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function FilterMenu({
  filterHook,
}: {
  filterHook: {
    state: FilterState;
    dispatch: React.ActionDispatch<[action: FilterAction]>;
  };
}) {
  const setIsCollapsed = useUiStore((s) => s.setIsCollapsed);
  const { t } = useI18n();
  const labelMap = {
    ALL: t("sidebar.filter.all"),
    CREATED: t("sidebar.filter.created"),
    SUBSCRIBED: t("sidebar.filter.subscribed"),
    ARTISTS: t("sidebar.filter.artists"),
    ENLARGE: t("sidebar.filter.expand"),
    "CREATE PLAYLISTS": t("sidebar.filter.createPlaylists"),
  } as const;

  const handleMenuSelect = (item: string) => {
    switch (item) {
      case "ENLARGE":
        setIsCollapsed(false);
        break;
      default:
        console.log(`Selected ${item}`);
        break;
    }
  };

  return (
    <DropdownMenu>
      {/* 最显示的 菜单栏按钮 */}
      <DropdownMenuTrigger asChild>
        {/* 增加了 focus:outline-none 和 focus-visible:ring-0 去除焦点白框 */}
        <button
          type="button"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center p-0",
            "focus:outline-none focus-visible:ring-0 focus-visible:outline-none",
          )}
        >
          <Menu className="size-5" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-full" align="start" side="right" sideOffset={14}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="dropdown-menu-label-momo mt-1">
            {t("sidebar.filter.title")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={stateToType[filterHook.state]}
            onValueChange={(value) => {
              if (isFilterType(value)) handleFilterSelect({ type: value }, filterHook.dispatch);
            }}
          >
            {FILTER_TYPES.map((item) => (
              <DropdownMenuRadioItem key={item} value={item} className="focus:bg-content/10">
                {iconList[item]}
                <span>{labelMap[item]}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>

        <DropdownMenuGroup>
          <DropdownMenuLabel className="dropdown-menu-label-momo mt-1">
            {t("sidebar.filter.playlistTitle")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(["CREATE PLAYLISTS", "ENLARGE"] as const).map((item) => (
            <DropdownMenuItem key={item} onSelect={() => handleMenuSelect(item)}>
              {iconList[item]}
              <span>{labelMap[item]}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
