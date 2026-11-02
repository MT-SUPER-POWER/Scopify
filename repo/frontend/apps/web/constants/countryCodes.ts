import type { CountryCodeItem } from "@/types/auth/login";

export const COUNTRY_CODES: CountryCodeItem[] = [
  // 常用置顶
  { code: "86", nameZh: "中国大陆", nameEn: "China", flag: "🇨🇳", popular: true },
  { code: "852", nameZh: "中国香港", nameEn: "Hong Kong", flag: "🇭🇰", popular: true },
  { code: "853", nameZh: "中国澳门", nameEn: "Macau", flag: "🇲🇴", popular: true },
  { code: "886", nameZh: "中国台湾", nameEn: "Taiwan", flag: "🇹🇼", popular: true },
  { code: "1", nameZh: "美国 / 加拿大", nameEn: "USA / Canada", flag: "🇺🇸", popular: true },
  { code: "81", nameZh: "日本", nameEn: "Japan", flag: "🇯🇵", popular: true },
  { code: "82", nameZh: "韩国", nameEn: "South Korea", flag: "🇰🇷", popular: true },
  { code: "44", nameZh: "英国", nameEn: "United Kingdom", flag: "🇬🇧", popular: true },
  { code: "61", nameZh: "澳大利亚", nameEn: "Australia", flag: "🇦🇺", popular: true },
  { code: "65", nameZh: "新加坡", nameEn: "Singapore", flag: "🇸🇬", popular: true },
  { code: "60", nameZh: "马来西亚", nameEn: "Malaysia", flag: "🇲🇾", popular: true },
  { code: "49", nameZh: "德国", nameEn: "Germany", flag: "🇩🇪", popular: true },
  { code: "33", nameZh: "法国", nameEn: "France", flag: "🇫🇷", popular: true },
  { code: "7", nameZh: "俄罗斯", nameEn: "Russia", flag: "🇷🇺", popular: true },

  // 其他国家/地区
  { code: "64", nameZh: "新西兰", nameEn: "New Zealand", flag: "🇳🇿" },
  { code: "84", nameZh: "越南", nameEn: "Vietnam", flag: "🇻🇳" },
  { code: "66", nameZh: "泰国", nameEn: "Thailand", flag: "🇹🇭" },
  { code: "62", nameZh: "印度尼西亚", nameEn: "Indonesia", flag: "🇮🇩" },
  { code: "63", nameZh: "菲律宾", nameEn: "Philippines", flag: "🇵🇭" },
  { code: "91", nameZh: "印度", nameEn: "India", flag: "🇮🇳" },
  { code: "39", nameZh: "意大利", nameEn: "Italy", flag: "🇮🇹" },
  { code: "34", nameZh: "西班牙", nameEn: "Spain", flag: "🇪🇸" },
  { code: "31", nameZh: "荷兰", nameEn: "Netherlands", flag: "🇳🇱" },
  { code: "41", nameZh: "瑞士", nameEn: "Switzerland", flag: "🇨🇭" },
  { code: "46", nameZh: "瑞典", nameEn: "Sweden", flag: "🇸🇪" },
  { code: "47", nameZh: "挪威", nameEn: "Norway", flag: "🇳🇴" },
  { code: "45", nameZh: "丹麦", nameEn: "Denmark", flag: "🇩🇰" },
  { code: "358", nameZh: "芬兰", nameEn: "Finland", flag: "🇫🇮" },
  { code: "48", nameZh: "波兰", nameEn: "Poland", flag: "🇵🇱" },
  { code: "351", nameZh: "葡萄牙", nameEn: "Portugal", flag: "🇵🇹" },
  { code: "353", nameZh: "爱尔兰", nameEn: "Ireland", flag: "🇮🇪" },
  { code: "32", nameZh: "比利时", nameEn: "Belgium", flag: "🇧🇪" },
  { code: "43", nameZh: "奥地利", nameEn: "Austria", flag: "🇦🇹" },
  { code: "30", nameZh: "希腊", nameEn: "Greece", flag: "🇬🇷" },
  { code: "90", nameZh: "土耳其", nameEn: "Turkey", flag: "🇹🇷" },
  { code: "971", nameZh: "阿联酋", nameEn: "United Arab Emirates", flag: "🇦🇪" },
  { code: "966", nameZh: "沙特阿拉伯", nameEn: "Saudi Arabia", flag: "🇸🇦" },
  { code: "55", nameZh: "巴西", nameEn: "Brazil", flag: "🇧🇷" },
  { code: "52", nameZh: "墨西哥", nameEn: "Mexico", flag: "🇲🇽" },
  { code: "54", nameZh: "阿根廷", nameEn: "Argentina", flag: "🇦🇷" },
  { code: "27", nameZh: "南非", nameEn: "South Africa", flag: "🇿🇦" },
  { code: "20", nameZh: "埃及", nameEn: "Egypt", flag: "🇪🇬" },
];

export const DEFAULT_COUNTRY_CODE = "86";

export function getCountryByCode(code: string): CountryCodeItem {
  const normalized = code.replace(/^\+/, "").trim();
  return (
    COUNTRY_CODES.find((c) => c.code === normalized) || {
      code: normalized,
      nameZh: "其他",
      nameEn: "Other",
      flag: "🌐",
    }
  );
}
