"use client";

import { useState, type MouseEvent } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProfileMenuIdentity } from "@/components/Header/ProfileMenuIdentity";
import { ProfileMenuNavigation } from "@/components/Header/ProfileMenuNavigation";
import { VipSignMenuCard } from "@/components/VipSign/VipSignMenuCard";
import { VipSignModal } from "@/components/VipSign/VipSignModal";
import { useVipSign } from "@/hooks/vipSign/useVipSign";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { runtime } from "@/lib/runtime";
import { useI18n } from "@/store/module/i18n";
import type { VipSignDetail } from "@/types/api/vipSign";
import type { ProfileMenuProps } from "@/types/components/profileMenu";

export function ProfileMenu({ children }: ProfileMenuProps) {
  const { t } = useI18n();
  const smartRouter = useSmartRouter();
  const isLoggedIn = useLoginStatus();

  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [modalTodayRecord, setModalTodayRecord] = useState<VipSignDetail | undefined>(undefined);

  const {
    hasSignedToday,
    isLoading: isSignLoading,
    doSign,
    fetchSignDetail,
    isSigning,
    fetchTodayRecord,
    signHistory,
  } = useVipSign();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 未签到执行 POST /vip/sign，已签到则 GET /vip/sign/detail 查看详情。
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleVipSign = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isSignLoading || isSigning) return;
    setProfileMenuOpen(false);

    let record: VipSignDetail | undefined;

    if (hasSignedToday) {
      // 已签到 → 读取当天详情，不再重复触发签到
      record = await fetchTodayRecord();
    } else {
      // 未签到 → 执行签到，从返回值里拿 checkinDetail.data
      const result = await doSign();
      record = result.checkinDetail?.data;
      // 兜底：如果签到返回里没有 checkinDetail，再单独请求一次
      if (!record) {
        record = await fetchTodayRecord();
      }
    }

    setModalTodayRecord(record);
    setSignModalOpen(true);
  };

  const handleSelectVipSignDay = async (signTime: number) => {
    setProfileMenuOpen(false);
    const record = await fetchSignDetail(signTime);
    if (!record) return;

    setModalTodayRecord(record);
    setSignModalOpen(true);
  };

  const handleLoginClick = () => {
    if (!runtime.auth.openLoginWindow()) smartRouter.push("/login");
  };

  return (
    <>
      <DropdownMenu open={isProfileMenuOpen} onOpenChange={setProfileMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t("profile.menu.profile")}
            className="cursor-pointer rounded-full focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-hidden"
          >
            {children}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-90 max-w-[calc(100vw-2rem)] overflow-x-hidden overflow-y-auto rounded-2xl border border-content/10 bg-surface-overlay bg-[radial-gradient(ellipse_at_top_right,rgba(119,118,75,0.16),transparent_55%)] p-0 text-content shadow-floating"
          align="end"
          side="bottom"
          sideOffset={8}
        >
          <ProfileMenuIdentity isLoggedIn={isLoggedIn} onLogin={handleLoginClick} />
          {isLoggedIn && (
            <>
              <DropdownMenuSeparator className="mx-6 my-0 bg-content/10" />
              <VipSignMenuCard
                actionLabel={
                  hasSignedToday ? t("profile.menu.viewMonthlySign") : t("profile.menu.signIn")
                }
                hasSignedToday={hasSignedToday}
                isLoading={isSignLoading}
                isSigning={isSigning}
                onAction={handleVipSign}
                onSelectSignDay={handleSelectVipSignDay}
                signHistory={signHistory}
              />
            </>
          )}
          <DropdownMenuSeparator className="mx-6 my-0 bg-content/10" />
          <ProfileMenuNavigation isLoggedIn={isLoggedIn} />
        </DropdownMenuContent>
      </DropdownMenu>

      {signModalOpen && (
        <VipSignModal
          open={signModalOpen}
          onClose={() => setSignModalOpen(false)}
          todayRecord={modalTodayRecord}
        />
      )}
    </>
  );
}
