import type { NotificationSnapshot } from "@scopify/desktop-contract";
import { useNotificationStore } from "@/store/module/notifications";

export async function performNotificationAction(action: () => Promise<NotificationSnapshot>) {
  useNotificationStore.setState({ pending: true, localError: false });
  try {
    useNotificationStore.getState().accept(await action());
  } catch {
    useNotificationStore.setState({ localError: true });
  } finally {
    useNotificationStore.setState({ pending: false });
  }
}
