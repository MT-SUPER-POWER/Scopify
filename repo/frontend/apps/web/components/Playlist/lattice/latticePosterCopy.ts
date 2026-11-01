// Title block shared by the poster and the lyric fallback; sizes follow the poster's
// `group/poster` data attributes (compact tile, expanded stage).
export const posterCopyClass =
  "absolute inset-x-5 bottom-5 flex flex-col gap-1.5 group-data-[expanded=true]/poster:inset-x-10 group-data-[expanded=true]/poster:bottom-[180px]";

// The 0.12em block padding keeps descenders of the clamped second line from being clipped.
export const posterTitleClass =
  "-my-[0.12em] line-clamp-2 py-[0.12em] text-[32px] leading-[1.12] font-bold tracking-[-0.025em] text-balance wrap-anywhere group-data-[compact=true]/poster:text-[28px] group-data-[expanded=true]/poster:max-w-[88%] group-data-[expanded=true]/poster:text-[48px] group-data-[expanded=true]/poster:leading-[1.1]";

export const posterSubtitleClass =
  "truncate text-[14px] leading-[1.35] font-medium opacity-72 group-data-[expanded=true]/poster:text-[18px]";
