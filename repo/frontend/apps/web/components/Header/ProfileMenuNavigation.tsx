import {
  Bell,
  ChevronRight,
  Download,
  Footprints,
  Info,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { runtime } from "@/lib/runtime";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { ProfileMenuNavigationProps } from "@/types/components/profileMenu";

const itemClassName =
  "group min-h-11 cursor-pointer gap-4 rounded-lg px-3 text-sm font-normal text-content transition-colors focus:bg-content/5 focus:text-content";
const iconClassName = "size-5 text-content-muted";
const arrowClassName = "ml-auto size-4 text-content-muted";

export function ProfileMenuNavigation({ isLoggedIn }: ProfileMenuNavigationProps) {
  const { t } = useI18n();
  const smartRouter = useSmartRouter();
  const logout = () => {
    useUserStore.getState().handleLogout();
    usePlayerStore.getState().cleanCache();
    smartRouter.replace("/");
  };

  return (
    <>
      <DropdownMenuGroup className="px-3 py-2">
        <DropdownMenuItem
          onSelect={() =>
            smartRouter.push(runtime.isDesktop ? "/setting?tab=desktop#app-updater" : "/setting")
          }
          className={`${itemClassName} md:hidden`}
        >
          <Bell className={iconClassName} />
          <span>{t("profile.menu.notifications")}</span>
          <ChevronRight className={arrowClassName} />
        </DropdownMenuItem>
        <DropdownMenuItem className={`${itemClassName} md:hidden`}>
          <Users className={iconClassName} />
          <span>{t("profile.menu.friends")}</span>
          <ChevronRight className={arrowClassName} />
        </DropdownMenuItem>
        {isLoggedIn && (
          <DropdownMenuItem
            onSelect={() => smartRouter.push("/recent/report")}
            className={itemClassName}
          >
            <Footprints className={iconClassName} />
            <span>{t("profile.menu.listeningReport")}</span>
            <ChevronRight className={arrowClassName} />
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => smartRouter.push("/setting")} className={itemClassName}>
          <Settings className={iconClassName} />
          <span>{t("profile.menu.settings")}</span>
          <ChevronRight className={arrowClassName} />
        </DropdownMenuItem>
        {!runtime.isDesktop && (
          <DropdownMenuItem
            onSelect={() =>
              window.location.assign("https://github.com/MT-SUPER-POWER/Scopify/releases")
            }
            className={itemClassName}
          >
            <Download className={iconClassName} />
            <span>{t("profile.menu.download")}</span>
            <ChevronRight className={arrowClassName} />
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => smartRouter.push("/me")} className={itemClassName}>
          <Info className={iconClassName} />
          <span>{t("profile.menu.aboutMe")}</span>
          <ChevronRight className={arrowClassName} />
        </DropdownMenuItem>
      </DropdownMenuGroup>
      {isLoggedIn && (
        <>
          <DropdownMenuSeparator className="mx-6 my-0 bg-content/10" />
          <div className="px-3 py-2">
            <DropdownMenuItem
              onSelect={logout}
              variant="destructive"
              className={`${itemClassName} min-h-10 text-destructive focus:bg-destructive/10 focus:text-destructive`}
            >
              <LogOut className="size-5 text-destructive" />
              <span>{t("common.action.logout")}</span>
            </DropdownMenuItem>
          </div>
        </>
      )}
    </>
  );
}
