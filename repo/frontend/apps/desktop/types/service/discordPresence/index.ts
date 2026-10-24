import type { DiscordPresenceStatus } from "@scopify/desktop-contract";
export interface DiscordPresenceControllerOptions {
  getApplicationId(): string;
  isEnabled(): boolean;
  onStatusChange?(status: DiscordPresenceStatus): void;
}
