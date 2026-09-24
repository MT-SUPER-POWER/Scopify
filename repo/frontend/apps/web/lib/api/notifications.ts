import request, { requestConfig } from "@/lib/web/request";
import type { NotificationRequest } from "@/types/api/notifications";

export async function requestNotificationSource({
  path,
  params,
  signal,
}: NotificationRequest): Promise<unknown> {
  const response = await request.get<unknown>(
    path,
    requestConfig({ params, signal, requiresMusicSession: true, expectedBusinessCodes: [200] }),
  );
  return response.data;
}
