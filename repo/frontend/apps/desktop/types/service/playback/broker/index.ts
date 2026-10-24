import type { PlaybackBootstrap } from "@scopify/desktop-contract";
import type { PlaybackBrokerPort } from "@/types/service/playback/broker/port";
export type PlaybackBrokerRejectionReason =
  | "authority-id-mismatch"
  | "bootstrap-required"
  | "duplicate-command-id"
  | "inactive-authority"
  | "inactive-replica"
  | "invalid-authority-payload"
  | "invalid-command"
  | "session-bootstrap-required"
  | "stale-sequence"
  | "uncloneable-message"
  | "unknown-command-receipt";

export interface PlaybackBrokerRejection {
  connectionId: string;
  messageType?: string;
  reason: PlaybackBrokerRejectionReason;
  sequence?: number;
  source: "authority" | "replica";
  validationReason?: string;
}

export interface PlaybackBrokerDiagnostics {
  acceptedMessages: number;
  activeAuthorityId: string | null;
  activeSessionId: string | null;
  authorityConnectionId: string | null;
  authorityDisconnects: number;
  authorityReplacements: number;
  bootstrapReplays: number;
  bootstrapSequence: number | null;
  commandReceiptsRouted: number;
  commandsForwarded: number;
  disposed: boolean;
  lastRejection: PlaybackBrokerRejection | null;
  lastSequence: number | null;
  messageDeliveries: number;
  pendingCommandCount: number;
  rejectionCounts: Readonly<Record<PlaybackBrokerRejectionReason, number>>;
  replicaCount: number;
  replicaDisconnects: number;
  replicaIds: string[];
  replicaReplacements: number;
}

export interface PlaybackBroker<TLyrics = unknown> {
  dispose(): void;
  /**
   * Returns the last coherent Authority state known to the broker.
   *
   * The returned value is a clone. Callers cannot mutate the replay state that
   * will be sent to late-joining replicas.
   */
  getBootstrap(): PlaybackBootstrap<TLyrics> | null;
  getDiagnostics(): PlaybackBrokerDiagnostics;
  registerAuthority(authorityId: string, port: PlaybackBrokerPort): () => void;
  registerReplica(replicaId: string, port: PlaybackBrokerPort): () => void;
  /**
   * Observes changes to the coherent Authority state. This deliberately has no
   * transport payload: consumers must read `getBootstrap()` so authority loss
   * and a newly accepted bootstrap have one consistent read path.
   */
  subscribe(listener: PlaybackBrokerStateListener): () => void;
}

export type PlaybackBrokerStateListener = () => void;

export interface PlaybackBrokerOptions {
  commandReceiptTimeoutMs?: number;
}

export interface PortConnection {
  closed: boolean;
  id: string;
  port: PlaybackBrokerPort;
  unsubscribeClose: () => void;
  unsubscribeMessage: () => void;
}

export interface PendingCommand {
  replica: PortConnection;
  timeout: ReturnType<typeof setTimeout>;
}

export type AuthorityDisconnectReason =
  "disposed" | "disconnected" | "replaced" | "transport-error";

export type ReplicaDisconnectReason = "disposed" | "disconnected" | "replaced" | "transport-error";
