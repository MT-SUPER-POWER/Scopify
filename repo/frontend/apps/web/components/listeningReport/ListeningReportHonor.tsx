import { IconTrophy } from "@tabler/icons-react";

import type { ListeningReportHonorProps } from "@/types/components/listeningReport";

export function ListeningReportHonor({
  activeDays,
  attendanceTarget,
  fallbackLabel,
}: ListeningReportHonorProps) {
  const isFullAttendance = Boolean(
    activeDays && attendanceTarget && activeDays >= attendanceTarget,
  );
  const title = isFullAttendance ? "听歌全勤奖" : fallbackLabel;
  const attendanceDetail = activeDays
    ? attendanceTarget
      ? `${activeDays} / ${attendanceTarget} 个有声日子`
      : `${activeDays} 个有声日子`
    : "音乐一直陪在身边";

  return (
    <div aria-label={`${title}，${attendanceDetail}`} className="relative h-28 w-68 select-none">
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 w-72 max-w-none -translate-1/2 scale-y-75 opacity-95 mix-blend-screen drop-shadow-[0_0_14px_rgba(214,179,106,0.4)]"
        src="/images/listening-report/honor-laurel.png"
      />
      <div className="relative flex h-full flex-col items-center justify-center pt-1 text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
        <div className="flex items-center justify-center gap-1.5 text-warning">
          <span className="h-px w-7 bg-linear-to-r from-transparent to-warning/80" />
          <IconTrophy className="size-3" stroke={2.25} />
          <span className="h-px w-7 bg-linear-to-l from-transparent to-warning/80" />
        </div>
        <p className="mt-1 font-serif text-[15px] leading-none font-semibold tracking-[0.16em] text-warning">
          {title}
        </p>
        <p className="mt-1 text-[10px] font-medium tracking-[0.08em] text-content/75">
          {attendanceDetail}
        </p>
      </div>
    </div>
  );
}
