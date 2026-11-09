import type { ProviderAccountProfile } from "@/types/auth/account";
import type { QqLoginProfileDto } from "@/types/providers/qq/loginApi";

function text(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return String(value);
  if (typeof value !== "string") return undefined;
  return value.trim() || undefined;
}

/** The account behind a `/login/status` profile, or null when it names no account. */
export function toQqAccountProfile(
  dto: QqLoginProfileDto | undefined,
): ProviderAccountProfile | null {
  if (!dto) return null;
  const accountId = text(dto.str_musicid) ?? text(dto.musicid);
  const nickname = text(dto.info?.nick) ?? text(dto.nickname) ?? text(dto.nick);
  if (!accountId && !nickname) return null;
  const avatarUrl = text(dto.info?.logo) ?? text(dto.info?.headpic) ?? text(dto.avatarUrl);
  return {
    provider: "qq",
    accountId: accountId ?? "",
    nickname: nickname ?? accountId ?? "",
    ...(avatarUrl ? { avatarUrl } : {}),
  };
}
