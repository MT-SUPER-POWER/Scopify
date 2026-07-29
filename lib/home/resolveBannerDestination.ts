import type { NeteaseBanner } from "@/types/api/banner";
import type { BannerDestination, BannerTargetKind } from "@/types/home";

const ORPHEUS_TARGET_KINDS: Record<string, BannerTargetKind> = {
  album: "album",
  artist: "artist",
  playlist: "playlist",
  radio: "radio",
  song: "song",
};

const TARGET_TYPE_KINDS: Record<number, BannerTargetKind> = {
  1: "song",
  10: "album",
  100: "artist",
  1000: "playlist",
  1009: "radio",
};

function toInternalDestination(kind: BannerTargetKind, targetId: string): BannerDestination {
  const id = encodeURIComponent(targetId);

  switch (kind) {
    case "album":
      return { href: `/album?id=${id}`, isExternal: false };
    case "artist":
      return { href: `/artist?id=${id}`, isExternal: false };
    case "playlist":
      return { href: `/playlist?id=${id}`, isExternal: false };
    case "radio":
      return { href: `/radio?id=${id}`, isExternal: false };
    case "song":
      return { href: `/comment?SongId=${id}`, isExternal: false };
  }
}

function parseOrpheusDestination(url: string): BannerDestination | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "orpheus:") return null;

    const kind = ORPHEUS_TARGET_KINDS[parsed.hostname];
    const targetId = parsed.pathname.slice(1).split("/")[0];
    if (!kind || !targetId) return null;

    return toInternalDestination(kind, targetId);
  } catch {
    return null;
  }
}

function parseExternalDestination(url: string): BannerDestination | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

    return { href: parsed.toString(), isExternal: true };
  } catch {
    return null;
  }
}

function getTargetId(banner: NeteaseBanner) {
  if (banner.targetId && banner.targetId > 0) return String(banner.targetId);
  if (banner.encodeId !== undefined && banner.encodeId !== "") return String(banner.encodeId);
  return null;
}

/** Resolves NetEase Banner URLs to the matching Scopify route or a safe external URL. */
export function resolveBannerDestination(banner: NeteaseBanner): BannerDestination | null {
  if (banner.url) {
    const orpheusDestination = parseOrpheusDestination(banner.url);
    if (orpheusDestination) return orpheusDestination;

    const externalDestination = parseExternalDestination(banner.url);
    if (externalDestination) return externalDestination;
  }

  const targetId = getTargetId(banner);
  const kind = banner.targetType === undefined ? undefined : TARGET_TYPE_KINDS[banner.targetType];
  return kind && targetId ? toInternalDestination(kind, targetId) : null;
}
