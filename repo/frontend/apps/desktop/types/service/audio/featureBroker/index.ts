import type { AudioFeatureFrameV1 } from "@scopify/desktop-contract";
import type { AudioFeatureBrokerPort } from "@/types/service/audio/featureBroker/port";
export type AudioFeatureBrokerRejectionReason =
  | "ack-mismatch"
  | "inactive-publisher"
  | "inactive-subscriber"
  | "invalid-ack"
  | "invalid-frame"
  | "unexpected-publisher-payload"
  | "unexpected-subscriber-payload"
  | "uncloneable-frame";

export interface AudioFeatureBrokerRejection {
  connectionId: string;
  messageType?: string;
  reason: AudioFeatureBrokerRejectionReason;
  source: "publisher" | "subscriber";
}

export interface AudioFeatureBrokerSubscriberDiagnostics {
  connectionId: string;
  inFlightSequence: number | null;
  inFlightStreamId: string | null;
  pendingLatestSequence: number | null;
  pendingLatestStreamId: string | null;
}

export interface AudioFeatureBrokerDiagnostics {
  ackTimeouts: number;
  acksAccepted: number;
  activePublisherConnectionId: string | null;
  disposed: boolean;
  framesAccepted: number;
  framesRejected: number;
  lastRejection: AudioFeatureBrokerRejection | null;
  pendingOverwrites: number;
  publisherDisconnects: number;
  publisherReplacements: number;
  subscriberCount: number;
  subscriberDeliveries: number;
  subscriberDisconnects: number;
  subscriberIds: string[];
  subscriberReplacements: number;
  subscribers: AudioFeatureBrokerSubscriberDiagnostics[];
}

export interface AudioFeatureBrokerClock {
  nowMs(): number;
}

export interface AudioFeatureBrokerScheduler {
  clearTimeout(timeout: unknown): void;
  setTimeout(callback: () => void, delayMs: number): unknown;
}

export interface AudioFeatureBrokerOptions {
  ackTimeoutMs?: number;
  clock?: AudioFeatureBrokerClock;
  scheduler?: AudioFeatureBrokerScheduler;
}

export interface AudioFeatureBroker {
  dispose(): void;
  getDiagnostics(): AudioFeatureBrokerDiagnostics;
  registerPublisher(publisherId: string, port: AudioFeatureBrokerPort): () => void;
  registerSubscriber(subscriberId: string, port: AudioFeatureBrokerPort): () => void;
}

export interface PortConnection {
  closed: boolean;
  id: string;
  port: AudioFeatureBrokerPort;
  unsubscribeClose: () => void;
  unsubscribeMessage: () => void;
}

export interface InFlightFrame {
  frame: AudioFeatureFrameV1;
  sentAtMs: number;
  timeout: unknown;
}

export interface SubscriberConnection {
  connection: PortConnection;
  inFlight: InFlightFrame | null;
  pendingLatest: AudioFeatureFrameV1 | null;
}

export type PublisherDisconnectReason =
  "disconnected" | "disposed" | "replaced" | "transport-error";

export type SubscriberDisconnectReason =
  "disconnected" | "disposed" | "replaced" | "transport-error";
