import MainLayout from "@/components/MainLayout";
import { NavigationScrollProvider } from "@/components/shared/NavigationScrollProvider";
import { PlayerCommandHandler } from "@/components/PlayerCommandHandler";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <NavigationScrollProvider>
      <MainLayout>
        <PlayerCommandHandler />
        {children}
      </MainLayout>
    </NavigationScrollProvider>
  );
}
