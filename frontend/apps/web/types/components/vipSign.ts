import type { MouseEvent } from "react";
import type { VipSignHistory } from "@/types/api/vipSign";

export interface VipSignMenuCardProps {
  actionLabel: string;
  hasSignedToday: boolean;
  isLoading: boolean;
  isSigning: boolean;
  onAction: (event: MouseEvent<HTMLButtonElement>) => void;
  onSelectSignDay: (signTime: number) => void;
  signHistory?: VipSignHistory;
}
