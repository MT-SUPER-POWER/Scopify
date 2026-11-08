import type { MusicProvider } from "@scopify/music-domain/identity";
import type { QrStatus } from "@/types/auth/login";
import type { QqLoginChannel } from "@/types/providers/qq/loginApi";

export interface QqQrLoginOptions {
  channel: QqLoginChannel;
  /** Browser only: called after a successful login; Desktop closes the login window instead. */
  onSuccess?: () => void;
}

export interface QqQrLoginProps {
  onSuccess?: () => void;
}

export interface QrCodePanelProps {
  qrImg: string;
  qrStatus: QrStatus;
  qrStatusText: string;
  scanHint: string;
  onRefresh: () => void;
}

export interface LoginPlatformSwitchProps {
  value: MusicProvider;
  disabled?: boolean;
  onChange: (provider: MusicProvider) => void;
}
