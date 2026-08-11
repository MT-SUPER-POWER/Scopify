import type { MouseEvent } from "react";
import type { VipSignDetail, VipSignHistory, VipSignHistoryItem } from "@/types/api/vipSign";

export interface VipSignModalProps {
  open: boolean;
  onClose: () => void;
  /** 签到或日期详情接口返回的展示数据 */
  todayRecord: VipSignDetail | undefined;
}

export interface VipSignMenuCardProps {
  actionLabel: string;
  hasSignedToday: boolean;
  isLoading: boolean;
  isSigning: boolean;
  onAction: (event: MouseEvent<HTMLButtonElement>) => void;
  onSelectSignDay: (signTime: number) => void;
  signHistory?: VipSignHistory;
}

export interface VipSignHistoryStripProps {
  records: VipSignHistoryItem[];
  onSelectSignDay: (signTime: number) => void;
}
