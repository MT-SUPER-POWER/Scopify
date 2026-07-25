export function isVipSong(fee: number | null | undefined): boolean {
  return fee === 1;
}

export function hasVipMembership(vipType: number | null | undefined): boolean {
  return typeof vipType === "number" && vipType > 0;
}
