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

export function ProfileMenu({ children }: { children?: React.ReactNode }) {

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

      {/* TODO: 点击显示的功能和实际相关  */}
      <DropdownMenuTrigger asChild>
        <button>
          {children}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-full" align="end" side="bottom">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="dropdown-menu-label-momo mt-1">
            Filter
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(["ALL", "PLAYLISTS", "ARTISTS"] as const).map((item) => (
            <DropdownMenuItem key={item} onSelect={() => console.log(`Selected ${item}`)}>
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
          {(["CREATE PLAYLISTS", "ENLARGE", "COLLAPSE"] as const).map((item) => (
            <DropdownMenuItem key={item} onSelect={() => console.log(`Selected ${item}`)}>
              {iconList[item]}
              <span>{item}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu >
  )
}
