import type { AudioFeatureAck, AudioFeatureFrameV1 } from "@scopifymusicplayer/desktop-contract";
import { isAudioFeatureAck, isAudioFeatureFrame } from "@scopifymusicplayer/desktop-contract";

import type { AudioFeatureBrokerPort } from "./port.js";

export type { AudioFeatureBrokerPort } from "./port.js";
export {
  createOwnedAudioFeatureConnectionId,
  parseAudioFeatureConnectionRequest,
} from "./connectionRequest.js";

const DEFAULT_ACK_TIMEOUT_MS = 1_000;
const MAXIMUM_ACK_TIMEOUT_MS = 60_000;

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

interface PortConnection {
  closed: boolean;
  id: string;
  port: AudioFeatureBrokerPort;
  unsubscribeClose: () => void;
  unsubscribeMessage: () => void;
}

interface InFlightFrame {
  frame: AudioFeatureFrameV1;
  sentAtMs: number;
  timeout: unknown;
}

interface SubscriberConnection {
  connection: PortConnection;
  inFlight: InFlightFrame | null;
  pendingLatest: AudioFeatureFrameV1 | null;
}

type PublisherDisconnectReason = "disconnected" | "disposed" | "replaced" | "transport-error";
type SubscriberDisconnectReason = "disconnected" | "disposed" | "replaced" | "transport-error";

/**
 * Routes lossy analyser frames from one publisher to independent ACK-gated
 * subscribers. Each subscriber can hold exactly one sent frame and one newest
 * unsent frame; older pending frames are intentionally discarded.
 */
export function createAudioFeatureBroker(
  options: AudioFeatureBrokerOptions = {},
): AudioFeatureBroker {
  const ackTimeoutMs = options.ackTimeoutMs ?? DEFAULT_ACK_TIMEOUT_MS;
  if (
    !Number.isFinite(ackTimeoutMs) ||
    ackTimeoutMs <= 0 ||
    ackTimeoutMs > MAXIMUM_ACK_TIMEOUT_MS
  ) {
    throw new RangeError(`ackTimeoutMs must be between 1 and ${MAXIMUM_ACK_TIMEOUT_MS}`);
  }

  const clock = options.clock ?? { nowMs: () => Date.now() };
  const scheduler =
    options.scheduler ??
    ({
      clearTimeout: (timeout: unknown) => clearTimeout(timeout as ReturnType<typeof setTimeout>),
      setTimeout: (callback: () => void, delayMs: number) => {
        const timeout = setTimeout(callback, delayMs);
        if (typeof timeout === "object" && timeout && "unref" in timeout) {
          (timeout as { unref(): void }).unref();
        }
        return timeout;
      },
    } satisfies AudioFeatureBrokerScheduler);

  let disposed = false;
  let lastRejection: AudioFeatureBrokerRejection | null = null;
  let publisher: PortConnection | null = null;
  const subscribers = new Map<string, SubscriberConnection>();
  const counters = {
    ackTimeouts: 0,
    acksAccepted: 0,
    framesAccepted: 0,
    framesRejected: 0,
    pendingOverwrites: 0,
    publisherDisconnects: 0,
    publisherReplacements: 0,
    subscriberDeliveries: 0,
    subscriberDisconnects: 0,
    subscriberReplacements: 0,
  };

  function registerPublisher(publisherId: string, port: AudioFeatureBrokerPort) {
    requireConnectionId(publisherId, "publisher");
    requireActiveBroker();

    if (publisher) disconnectPublisher(publisher, "replaced", true);

    const connection = createConnection(publisherId, port);
    publisher = connection;
    try {
      attachConnection(
        connection,
        (message) => handlePublisherMessage(connection, message),
        () => disconnectPublisher(connection, "disconnected", false),
      );
    } catch (error) {
      if (publisher === connection) publisher = null;
      closeConnection(connection, true);
      throw error;
    }
    return once(() => disconnectPublisher(connection, "disconnected", true));
  }

  function registerSubscriber(subscriberId: string, port: AudioFeatureBrokerPort) {
    requireConnectionId(subscriberId, "subscriber");
    requireActiveBroker();

    const current = subscribers.get(subscriberId);
    if (current) disconnectSubscriber(current, "replaced", true);

    const subscriber: SubscriberConnection = {
      connection: createConnection(subscriberId, port),
      inFlight: null,
      pendingLatest: null,
    };
    subscribers.set(subscriberId, subscriber);
    try {
      attachConnection(
        subscriber.connection,
        (message) => handleSubscriberMessage(subscriber, message),
        () => disconnectSubscriber(subscriber, "disconnected", false),
      );
    } catch (error) {
      disconnectSubscriber(subscriber, "transport-error", true);
      throw error;
    }
    return once(() => disconnectSubscriber(subscriber, "disconnected", true));
  }

  function handlePublisherMessage(connection: PortConnection, value: unknown) {
    if (publisher !== connection) {
      reject(connection, "publisher", "inactive-publisher", value);
      return;
    }
    if (isAudioFeatureAck(value)) {
      reject(connection, "publisher", "unexpected-publisher-payload", value);
      return;
    }
    if (!isAudioFeatureFrame(value)) {
      reject(connection, "publisher", "invalid-frame", value);
      counters.framesRejected += 1;
      return;
    }

    const frame = cloneFrame(connection, "publisher", value);
    if (!frame) return;
    counters.framesAccepted += 1;
    for (const subscriber of [...subscribers.values()]) enqueueFrame(subscriber, frame);
  }

  function handleSubscriberMessage(subscriber: SubscriberConnection, value: unknown) {
    const connection = subscriber.connection;
    if (subscribers.get(connection.id) !== subscriber) {
      reject(connection, "subscriber", "inactive-subscriber", value);
      return;
    }
    if (isAudioFeatureFrame(value)) {
      reject(connection, "subscriber", "unexpected-subscriber-payload", value);
      return;
    }
    if (!isAudioFeatureAck(value)) {
      reject(connection, "subscriber", "invalid-ack", value);
      return;
    }
    acknowledge(subscriber, value);
  }

  function enqueueFrame(subscriber: SubscriberConnection, frame: AudioFeatureFrameV1) {
    if (subscriber.inFlight) {
      if (subscriber.pendingLatest) counters.pendingOverwrites += 1;
      subscriber.pendingLatest = frame;
      return;
    }
    sendFrame(subscriber, frame);
  }

  function sendFrame(subscriber: SubscriberConnection, frame: AudioFeatureFrameV1) {
    let outbound: AudioFeatureFrameV1;
    try {
      outbound = structuredClone(frame);
    } catch {
      reject(subscriber.connection, "subscriber", "uncloneable-frame", frame);
      disconnectSubscriber(subscriber, "transport-error", true);
      return;
    }

    let inFlight: InFlightFrame;
    try {
      inFlight = {
        frame,
        sentAtMs: clock.nowMs(),
        timeout: undefined,
      };
      subscriber.inFlight = inFlight;
      inFlight.timeout = scheduler.setTimeout(() => {
        if (subscribers.get(subscriber.connection.id) !== subscriber) return;
        if (subscriber.inFlight !== inFlight) return;
        counters.ackTimeouts += 1;
      }, ackTimeoutMs);
    } catch {
      disconnectSubscriber(subscriber, "transport-error", true);
      return;
    }

    if (postToConnection(subscriber.connection, outbound)) {
      counters.subscriberDeliveries += 1;
      return;
    }
    disconnectSubscriber(subscriber, "transport-error", true);
  }

  function acknowledge(subscriber: SubscriberConnection, ack: AudioFeatureAck) {
    const inFlight = subscriber.inFlight;
    if (
      !inFlight ||
      inFlight.frame.streamId !== ack.streamId ||
      inFlight.frame.sequence !== ack.sequence
    ) {
      reject(subscriber.connection, "subscriber", "ack-mismatch", ack);
      return;
    }

    scheduler.clearTimeout(inFlight.timeout);
    subscriber.inFlight = null;
    counters.acksAccepted += 1;
    const pendingLatest = subscriber.pendingLatest;
    subscriber.pendingLatest = null;
    if (pendingLatest) sendFrame(subscriber, pendingLatest);
  }

  function disconnectPublisher(
    connection: PortConnection,
    reason: PublisherDisconnectReason,
    closePort: boolean,
  ) {
    if (publisher !== connection) {
      closeConnection(connection, closePort);
      return;
    }

    publisher = null;
    closeConnection(connection, closePort);
    clearSubscriberGates();
    if (reason === "replaced") {
      counters.publisherReplacements += 1;
    } else {
      counters.publisherDisconnects += 1;
    }
  }

  function disconnectSubscriber(
    subscriber: SubscriberConnection,
    reason: SubscriberDisconnectReason,
    closePort: boolean,
  ) {
    const { connection } = subscriber;
    if (subscribers.get(connection.id) !== subscriber) {
      clearSubscriberGate(subscriber);
      closeConnection(connection, closePort);
      return;
    }

    subscribers.delete(connection.id);
    clearSubscriberGate(subscriber);
    closeConnection(connection, closePort);
    if (reason === "replaced") counters.subscriberReplacements += 1;
    else counters.subscriberDisconnects += 1;
  }

  function clearSubscriberGates() {
    for (const subscriber of subscribers.values()) clearSubscriberGate(subscriber);
  }

  function clearSubscriberGate(subscriber: SubscriberConnection) {
    if (subscriber.inFlight) scheduler.clearTimeout(subscriber.inFlight.timeout);
    subscriber.inFlight = null;
    subscriber.pendingLatest = null;
  }

  function cloneFrame(
    connection: PortConnection,
    source: "publisher" | "subscriber",
    frame: AudioFeatureFrameV1,
  ): AudioFeatureFrameV1 | null {
    try {
      return structuredClone(frame);
    } catch {
      reject(connection, source, "uncloneable-frame", frame);
      counters.framesRejected += 1;
      return null;
    }
  }

  function reject(
    connection: PortConnection,
    source: "publisher" | "subscriber",
    reason: AudioFeatureBrokerRejectionReason,
    value: unknown,
  ) {
    lastRejection = {
      connectionId: connection.id,
      reason,
      source,
      ...describePayload(value),
    };
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (publisher) disconnectPublisher(publisher, "disposed", true);
    for (const subscriber of [...subscribers.values()]) {
      disconnectSubscriber(subscriber, "disposed", true);
    }
  }

  function getDiagnostics(): AudioFeatureBrokerDiagnostics {
    const subscriberDiagnostics = [...subscribers.values()]
      .map(({ connection, inFlight, pendingLatest }) => ({
        connectionId: connection.id,
        inFlightSequence: inFlight?.frame.sequence ?? null,
        inFlightStreamId: inFlight?.frame.streamId ?? null,
        pendingLatestSequence: pendingLatest?.sequence ?? null,
        pendingLatestStreamId: pendingLatest?.streamId ?? null,
      }))
      .sort((left, right) => left.connectionId.localeCompare(right.connectionId));
    return {
      ...counters,
      activePublisherConnectionId: publisher?.id ?? null,
      disposed,
      lastRejection: lastRejection ? { ...lastRejection } : null,
      subscriberCount: subscribers.size,
      subscriberIds: subscriberDiagnostics.map(({ connectionId }) => connectionId),
      subscribers: subscriberDiagnostics,
    };
  }

  function requireActiveBroker() {
    if (disposed) throw new Error("The audio-feature broker is disposed.");
  }

  return { dispose, getDiagnostics, registerPublisher, registerSubscriber };
}

function createConnection(id: string, port: AudioFeatureBrokerPort): PortConnection {
  return {
    closed: false,
    id,
    port,
    unsubscribeClose: () => undefined,
    unsubscribeMessage: () => undefined,
  };
}

function attachConnection(
  connection: PortConnection,
  onMessage: (message: unknown) => void,
  onClose: () => void,
) {
  connection.unsubscribeMessage = connection.port.onMessage(onMessage);
  connection.unsubscribeClose = connection.port.onClose(onClose);
}

function closeConnection(connection: PortConnection, closePort: boolean) {
  if (connection.closed) return;
  connection.closed = true;
  try {
    connection.unsubscribeMessage();
  } catch {
    // Listener teardown is isolated to this transport.
  }
  try {
    connection.unsubscribeClose();
  } catch {
    // Listener teardown is isolated to this transport.
  }
  if (!closePort) return;
  try {
    connection.port.close();
  } catch {
    // The transport is already detached; closing failures cannot affect peers.
  }
}

function postToConnection(connection: PortConnection, value: unknown): boolean {
  if (connection.closed) return false;
  try {
    connection.port.postMessage(value);
    return true;
  } catch {
    return false;
  }
}

function requireConnectionId(id: string, role: "publisher" | "subscriber") {
  if (typeof id !== "string" || id.length === 0 || id.length > 128) {
    throw new RangeError(
      `${role} connection ID must be a non-empty string of at most 128 characters.`,
    );
  }
}

function describePayload(value: unknown): Pick<AudioFeatureBrokerRejection, "messageType"> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  const type = (value as Record<string, unknown>).type;
  return typeof type === "string" ? { messageType: type } : {};
}

function once(callback: () => void): () => void {
  let called = false;
  return () => {
    if (called) return;
    called = true;
    callback();
  };
}
