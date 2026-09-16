"use client";

import { Eye, Link, MessageCircle, Play } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useCommentCountQuery } from "@/hooks/comment/useCommentCountQuery";
import { useSidebarPlaylistPlayback } from "@/hooks/sidebar/useSidebarPlaylistPlayback";
import { getCommentHref } from "@/lib/comment/commentResource";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { formatCompactCount } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { LibItemMenuProps } from "@/types/components/Siderbar";
import { SidebarPlaylistManagement } from "./SidebarPlaylistManagement";

function LibItemContextMenu({ children, playlistID }: LibItemMenuProps) {
  const smartRouter = useSmartRouter();
  const { t } = useI18n();
  const [contextMenuOpen, setContextMenuOpen] = React.useState(false);
  const play = useSidebarPlaylistPlayback(playlistID);
  const { data: commentCount } = useCommentCountQuery(
    "playlist",
    String(playlistID),
    contextMenuOpen,
  );

  return (
    <SidebarPlaylistManagement playlistId={playlistID}>
      {(managementActions) => (
        <ContextMenu onOpenChange={setContextMenuOpen}>
          <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
          <ContextMenuContent className="w-48">
            {/* 歌单和播放快捷 */}
            <ContextMenuGroup>
              <ContextMenuItem
                onClick={() => {
                  smartRouter.push(`/playlist/?id=${playlistID}`);
                }}
              >
                <Eye className="mr-2 size-4" />
                {t("contextMenu.view")}
              </ContextMenuItem>
              <ContextMenuItem onClick={play}>
                <Play className="mr-2 size-4" />
                {t("contextMenu.play")}
              </ContextMenuItem>
            </ContextMenuGroup>

            <ContextMenuSeparator />

            {/* 杂项，未来拓展 */}
            <ContextMenuGroup>
              <ContextMenuItem
                onClick={() => {
                  smartRouter.push(getCommentHref("playlist", playlistID));
                }}
              >
                <MessageCircle className="mr-2 size-4" />
                {commentCount === undefined
                  ? t("contextMenu.viewComments")
                  : t("contextMenu.viewCommentsWithCount", {
                      count: formatCompactCount(commentCount),
                    })}
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  const url = `https://music.163.com/#/playlist?id=${playlistID}`;
                  navigator.clipboard.writeText(url);
                  toast.success(t("sidebar.lib.playlistLinkCopied"));
                }}
              >
                <Link className="mr-2 size-4" />
                {t("contextMenu.copyPlaylistLink")}
              </ContextMenuItem>
            </ContextMenuGroup>

            {managementActions}
          </ContextMenuContent>
        </ContextMenu>
      )}
    </SidebarPlaylistManagement>
  );
}

export default React.memo(LibItemContextMenu);
