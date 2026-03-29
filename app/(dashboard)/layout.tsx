import MainLayout from "@/components/MainLayout";
import { PlayerCommandHandler } from "@/components/PlayerCommandHandler";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout>
      <PlayerCommandHandler />
      {children}
    </MainLayout>
  );
}
