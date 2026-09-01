import type { ListeningReportGrandFinaleBannerProps } from "@/types/components/listeningReport";

export function ListeningReportGrandFinaleBanner({
  footerSummary,
}: ListeningReportGrandFinaleBannerProps) {
  return (
    <div className="mx-auto mt-14 w-full px-5 sm:mt-20 sm:px-4 lg:px-8">
      <div className="group relative flex min-h-25 w-full items-center overflow-hidden border border-border/60 bg-surface-raised/40 p-6 transition-colors hover:border-border hover:bg-surface-raised/60 sm:min-h-52 sm:p-10 lg:min-h-60 lg:p-12">
        {/* 左侧封面大图与向右渐变消融 */}
        {footerSummary.coverUrl ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[46%] overflow-hidden select-none sm:w-[38%] lg:w-[30%]">
            <img
              alt=""
              className="size-full object-cover transition-transform duration-1000 group-hover:scale-105"
              src={footerSummary.coverUrl}
            />
            {/* 向右深色渐变平滑过渡 */}
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-surface-raised/75 to-surface-raised" />
          </div>
        ) : null}

        {/* 主文案与品牌标识 */}
        <div className="relative z-10 flex flex-col justify-center pl-[48%] sm:pl-[42%] lg:pl-[35%]">
          <h3 className="max-w-3xl text-[24px] leading-snug font-black tracking-tight text-content">
            {footerSummary.quote}
          </h3>
          <div className="mt-4 flex items-center gap-2.5 text-xs font-semibold text-content-muted sm:text-sm">
            <img
              alt="Logo"
              className="flex size-4.5 items-center justify-center rounded-full bg-brand shadow-xs"
              src="/icon.ico"
            />
            <span>{footerSummary.brandingText}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
