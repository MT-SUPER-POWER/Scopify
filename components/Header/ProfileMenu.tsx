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

export function ProfileMenu() {

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
      <DropdownMenuTrigger asChild>
        <button className="h-10 w-10 p-0 flex items-center justify-center shrink-0">
          <Menu className="w-5 h-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full" align="center" side="right">
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
