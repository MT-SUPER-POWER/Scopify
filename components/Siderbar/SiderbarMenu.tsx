import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button"
import { Plus, PanelLeftClose, Menu } from "lucide-react";

export function SiderBarMenu({
  panelAPI
}: {
  panelAPI?: {
    collapse: () => void | undefined;
    expand: () => void | undefined;
  };
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost"> <Menu className="w-7 h-7" /> </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40" align="start">

        {/* Group -- Sider Function */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="dropdown-menu-label-momo mt-1"> Sider Bar </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => panelAPI?.collapse?.()}>
            <PanelLeftClose className="w-5 h-5 hover:scale-110 active:scale-95 transition-transform mr-2" />
            <span>Collapse</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {/* Group -- Playlist Function */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="dropdown-menu-label-momo mt-1"> Playlist </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Plus className="w-5 h-5 mr-2" />
            <span>Create playlist</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

      </DropdownMenuContent>
    </DropdownMenu>
  )
}
