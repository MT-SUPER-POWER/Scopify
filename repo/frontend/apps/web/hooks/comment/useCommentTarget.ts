"use client";

import type { MusicCommentTarget } from "@scopify/music-domain/comment";
import { useMemo } from "react";

import { useProviderCapability, useActiveProvider } from "@/hooks/provider/useActiveProvider";
import { commentTargetKindOf, toCommentTarget } from "@/lib/comment/commentResource";
import type { CommentResource, CommentResourceKind } from "@/types/comment/model";

/** The comment thread of a resource on the active platform. */
export function useCommentTarget(resource: CommentResource): MusicCommentTarget {
  const { provider } = useActiveProvider();
  return useMemo(
    () => toCommentTarget(provider, { id: resource.id, kind: resource.kind }),
    [provider, resource.id, resource.kind],
  );
}

/** Whether the active platform reads comments on this kind of resource. */
export function useCommentKindSupported(kind: CommentResourceKind | undefined): boolean {
  const provider = useActiveProvider();
  const canRead = useProviderCapability("comments.read");
  return (
    canRead && kind !== undefined && provider.commentTargetKinds.has(commentTargetKindOf(kind))
  );
}
