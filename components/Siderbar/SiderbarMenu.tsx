// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button"
import { Plus, PanelLeftClose, Menu, Trash2, X } from "lucide-react";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import React from "react";
import { useUiStore, useUserStore } from "@/store";
import { createPlaylist, delPlaylist } from "@/lib/api/playlist";
import { toast } from "sonner";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, AlertDialogTitle } from "../ui/alert-dialog";
import { cn } from "@/lib/utils";


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleCreatePlaylist(playlistName: string, privacy: "0" | "10"): void {
  createPlaylist(playlistName, privacy).then((res) => {
    if (res.data.code === 200) {
      // 成功创建后更新用户歌单列表
      const newPlaylist = res.data.playlist;
      const userStore = useUserStore.getState();
      userStore.setPlayList([...userStore.playlist, newPlaylist]);
      toast.success(`Playlist "${playlistName}" has been created`);
    } else {
      console.error("创建歌单失败:", res.data.message);
      toast.error("Failed to create playlist");
    }
  });
}

function handleDeletePlaylist(playlistId: string | number, playlistName: string): void {
  delPlaylist(playlistId).then((res) => {
    if (res.data.code === 200) {
      // 成功删除后更新用户歌单列表
      const userStore = useUserStore.getState();
      const updatedPlaylists = userStore.playlist.filter(p => p.id !== playlistId);
      userStore.setPlayList(updatedPlaylists);
      toast.success(`${playlistName} has been deleted`);
    } else {
      console.error("删除歌单失败:", res.data.message);
      // toast.error("Failed to delete playlist");
    }
  });
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ COMPOENNT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ConfirmDialogShandCN({
  open, title, content, onConfirm, onCancel,
  confirmText = "确认", cancelText = "取消"
}: {
  open: boolean;
  title: string;
  content: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogOverlay className="bg-black/60 backdrop-blur-sm" />
      <AlertDialogContent className={cn(
        "bg-[#282828] border-none shadow-2xl rounded-xl w-96 p-8",
        "flex flex-col",
      )}>
        {/* text-center 覆盖 shadcn AlertDialogHeader 默认的 text-left */}
        <AlertDialogHeader className="space-y-2 mb-8 w-full">
          <AlertDialogTitle className="w-full text-2xl font-bold text-white tracking-tight text-center">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[#b3b3b3] text-sm">
            {content}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* sm:flex-col 覆盖 shadcn Footer 默认在宽屏变 flex-row 的行为 */}
        <AlertDialogFooter className="flex flex-col gap-4 w-full sm:flex-col">
          <button
            onClick={onConfirm}
            className="w-full py-3.5 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-bold text-base transition-all"
          >
            {confirmText}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3.5 rounded-full bg-transparent border border-[#727272] hover:border-white text-white font-bold text-base transition-all"
          >
            {cancelText}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function _SiderBarMenu() {
  const userPlaylists = useUserStore((s) => s.playlist);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<{ id: number | string; name: string } | null>(null);

  const handleDeleteClick = (id: number | string, name: string) => {
    setPendingDelete({ id, name });
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    handleDeletePlaylist(pendingDelete.id, pendingDelete.name);
    setConfirmOpen(false);
    setPendingDelete(null);
  };

  return (
    <>
      <ConfirmDialogShandCN
        open={confirmOpen}
        title="确认删除歌单"
        content={`确定要删除歌单 "${pendingDelete?.name}" 吗？此操作无法撤销。`}
        confirmText="确认删除"
        cancelText="取消"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost"> <Menu className="w-7 h-7" /> </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40" align="start">

          {/* Group -- Sider Function */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="dropdown-menu-label-momo mt-1"> Sider Bar </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => useUiStore.getState().setIsCollapsed(true)}>
              <PanelLeftClose className="w-5 h-5 hover:scale-110 active:scale-95 transition-transform mr-2" />
              <span>Collapse</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          {/* Group -- Playlist Function */}
          {useLoginStatus() && (
            <DropdownMenuGroup className="">
              <DropdownMenuLabel className="dropdown-menu-label-momo mt-1"> Playlist </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => handleCreatePlaylist}>
                <Plus className="w-5 h-5 mr-2" />
                <span>Create playlist</span>
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Trash2 className="w-5 h-5 mr-2 text-red-500/80" />
                  <span className="text-red-500/80">Delete playlist</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {userPlaylists.map((playlist) => (
                    <DropdownMenuItem
                      key={playlist.id}
                      onSelect={(e) => {
                        e.preventDefault(); // 防止对话框弹出时 Dropdown 抢夺焦点导致关闭
                        handleDeleteClick(playlist.id, playlist.name);
                      }}
                    >
                      <img src={playlist.coverImgUrl} alt="cover" className="w-6 h-6 rounded-sm mr-2" />
                      <span>{playlist.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

            </DropdownMenuGroup>
          )}

        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export const SiderBarMenu = React.memo(_SiderBarMenu);
