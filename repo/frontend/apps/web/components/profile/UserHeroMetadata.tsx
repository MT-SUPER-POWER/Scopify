import { CalendarDays, MapPin } from "lucide-react";
import {
  IconZodiacAquarius,
  IconZodiacAries,
  IconZodiacCancer,
  IconZodiacCapricorn,
  IconZodiacGemini,
  IconZodiacLeo,
  IconZodiacLibra,
  IconZodiacPisces,
  IconZodiacSagittarius,
  IconZodiacScorpio,
  IconZodiacTaurus,
  IconZodiacVirgo,
} from "@tabler/icons-react";

import { getLocationName } from "@/constants/location";
import { useI18n } from "@/store/module/i18n";
import type { UserHeroMetadataProps } from "@/types/components/profile";

export function UserHeroMetadata({ userInfo }: UserHeroMetadataProps) {
  const { t } = useI18n();
  const zodiac = getZodiacSign(userInfo.birthday);
  const locationName = getLocationName(userInfo.province, userInfo.city);

  return (
    <div className="mb-2 flex flex-wrap items-center gap-2 md:mb-4">
      <span className="rounded-sm bg-content/10 px-3 py-1 text-sm tracking-wider text-content/90 uppercase">
        PROFILE
      </span>
      {locationName ? (
        <span className="flex items-center gap-1.5 rounded-sm bg-content/10 px-3 py-1 text-[13px] text-content/90">
          <MapPin size={14} />
          {locationName}
        </span>
      ) : null}
      {zodiac ? (
        <span className="flex items-center gap-1.5 rounded-sm bg-content/10 px-3 py-1 text-[13px] text-content/90">
          <zodiac.Icon size={16} stroke={2.5} />
          {zodiac.text}
        </span>
      ) : null}
      {userInfo.createTime ? (
        <span className="flex items-center gap-1.5 rounded-sm bg-content/10 px-3 py-1 text-[13px] text-content/90">
          <CalendarDays size={14} />
          {t("profile.hero.joined", { date: formatDate(userInfo.createTime) })}
        </span>
      ) : null}
    </div>
  );
}

function getZodiacSign(dateTimestamp?: number) {
  if (!dateTimestamp) return null;
  const date = new Date(dateTimestamp);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if ((month === 1 && day <= 20) || (month === 12 && day >= 22))
    return { text: "摩羯座", Icon: IconZodiacCapricorn };
  if ((month === 1 && day >= 21) || (month === 2 && day <= 18))
    return { text: "水瓶座", Icon: IconZodiacAquarius };
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20))
    return { text: "双鱼座", Icon: IconZodiacPisces };
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19))
    return { text: "白羊座", Icon: IconZodiacAries };
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20))
    return { text: "金牛座", Icon: IconZodiacTaurus };
  if ((month === 5 && day >= 21) || (month === 6 && day <= 21))
    return { text: "双子座", Icon: IconZodiacGemini };
  if ((month === 6 && day >= 22) || (month === 7 && day <= 22))
    return { text: "巨蟹座", Icon: IconZodiacCancer };
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22))
    return { text: "狮子座", Icon: IconZodiacLeo };
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22))
    return { text: "处女座", Icon: IconZodiacVirgo };
  if ((month === 9 && day >= 23) || (month === 10 && day <= 23))
    return { text: "天秤座", Icon: IconZodiacLibra };
  if ((month === 10 && day >= 24) || (month === 11 && day <= 22))
    return { text: "天蝎座", Icon: IconZodiacScorpio };
  if ((month === 11 && day >= 23) || (month === 12 && day <= 21))
    return { text: "射手座", Icon: IconZodiacSagittarius };
  return null;
}

function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
