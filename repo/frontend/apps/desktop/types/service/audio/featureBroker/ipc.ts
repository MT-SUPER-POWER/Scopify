import type { BrowserWindow } from "electron";
import type { AudioFeatureBrokerDiagnostics } from "@/types/service/audio/featureBroker";
export interface AudioFeatureBrokerIpcOptions {
  getPublisherWindow(): BrowserWindow | null;
  getSubscriberWindows(): Array<BrowserWindow | null>;
  /** Called once for each authorized publisher transport that registers successfully. */
  onPublisherConnected?(senderId: number): void;
  onRejected?(message: string): void;
}

export interface AudioFeatureBrokerIpcHost {
  dispose(): void;
  getDiagnostics(): AudioFeatureBrokerDiagnostics;
}
