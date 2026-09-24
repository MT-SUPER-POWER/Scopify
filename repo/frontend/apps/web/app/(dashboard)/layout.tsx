import MainLayout from "@/components/MainLayout";
import { NavigationScrollProvider } from "@/components/shared/NavigationScrollProvider";
import { PlayerCommandHandler } from "@/components/player/PlayerCommandHandler";
import { NotificationRuntime } from "@/components/notifications/NotificationRuntime";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <NavigationScrollProvider>
      <MainLayout>
        <PlayerCommandHandler />
        <NotificationRuntime />
        {children}
      </MainLayout>
    </NavigationScrollProvider>
  );
}
