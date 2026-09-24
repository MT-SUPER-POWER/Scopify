import type { NotificationSnapshot } from "@scopify/desktop-contract";
import { useNotificationStore } from "@/store/module/notifications";

export async function performNotificationAction(action: () => Promise<NotificationSnapshot>) {
  useNotificationStore.setState({ pending: true, localError: false });
  try {
    const snapshot = await action();
    useNotificationStore.getState().accept(snapshot);
    return snapshot;
  } catch {
    useNotificationStore.setState({ localError: true });
    return null;
  } finally {
    useNotificationStore.setState({ pending: false });
  }
}
