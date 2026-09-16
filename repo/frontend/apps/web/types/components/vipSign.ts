import type { MouseEvent, RefObject } from "react";
import type { MotionValue } from "framer-motion";
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

export type VipSignTicketProps = Omit<VipSignModalProps, "open">;

export interface VipSignTicketContentProps {
  todayRecord: VipSignDetail | undefined;
}

export interface VipSignTicketStubProps extends VipSignTicketContentProps {
  onPlay: () => void;
  isPlaying: boolean;
}

export interface TicketPointerOrigin {
  id: number;
  x: number;
  y: number;
  travel: number;
  initialProgress: number;
  axisX: number;
  axisY: number;
}

export interface TicketReturnAnimation {
  stop: () => void;
}

export interface TicketCurlProps {
  source: RefObject<HTMLDivElement | null>;
  progress: MotionValue<number>;
  direction: MotionValue<number>;
}

export interface VipSignHistoryStripProps {
  records: VipSignHistoryItem[];
  onSelectSignDay: (signTime: number) => void;
}
