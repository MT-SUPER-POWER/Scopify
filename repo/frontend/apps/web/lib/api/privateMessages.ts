import { requestData } from "@/lib/web/request";
import type {
  PrivateConversationResponse,
  PrivateHistoryResponse,
  PrivateSendResponse,
} from "@/types/api/privateMessages";

export function getPrivateConversations(offset: number, signal?: AbortSignal) {
  return requestData<PrivateConversationResponse>({
    url: "/msg/private",
    method: "GET",
    params: { offset, limit: 30 },
    signal,
    requiresMusicSession: true,
    expectedBusinessCodes: [200],
  });
}

export function getPrivateHistory(uid: string, before: number, signal?: AbortSignal) {
  return requestData<PrivateHistoryResponse>({
    url: "/msg/private/history",
    method: "GET",
    params: { uid, before, limit: 30 },
    signal,
    requiresMusicSession: true,
    expectedBusinessCodes: [200],
  });
}

export function sendPrivateText(uid: string, message: string) {
  return requestData<PrivateSendResponse>({
    url: "/send/text",
    method: "POST",
    data: { user_ids: uid, msg: message },
    requiresMusicSession: true,
    expectedBusinessCodes: [200],
  });
}
