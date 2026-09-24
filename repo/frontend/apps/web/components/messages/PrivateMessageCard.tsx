"use client";

import Link from "next/link";
import { Disc3 } from "lucide-react";
import { useFriendsStore } from "@/store/module/friends";
import { useI18n } from "@/store/module/i18n";
import type { PrivateMessageCardProps } from "@/types/components/privateMessages";

export function PrivateMessageCard({ attachment }: PrivateMessageCardProps) {
  const { t } = useI18n();
  const content = (
    <>
      {attachment.imageUrl ? (
        <img
          src={attachment.imageUrl}
          alt={attachment.title || t("privateMessages.image")}
          loading="lazy"
          className="aspect-square w-full object-cover"
        />
      ) : (
        <div className="flex aspect-square items-center justify-center bg-foreground/5">
          <Disc3 className="size-12 text-content-muted" />
        </div>
      )}
      {attachment.kind !== "image" && (
        <div className="space-y-1 p-3">
          <span className="line-clamp-2 text-sm font-medium text-foreground">
            {attachment.title}
          </span>
          <span className="line-clamp-1 text-xs text-content-muted">
            {attachment.subtitle || t(`privateMessages.${attachment.kind}`)}
          </span>
        </div>
      )}
    </>
  );
  const className = "block w-52 max-w-full overflow-hidden rounded-lg bg-foreground/7";
  return attachment.href ? (
    <Link
      href={attachment.href}
      className={`${className} transition-colors hover:bg-foreground/12 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none`}
      onClick={() => useFriendsStore.getState().setOpen(false)}
    >
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
