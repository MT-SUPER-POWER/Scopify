export function isPaidSong(fee: number | null | undefined): boolean {
  return typeof fee === "number" && fee > 0;
}

export function hasVipMembership(vipType: number | null | undefined): boolean {
  return typeof vipType === "number" && vipType > 0;
}
