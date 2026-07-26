import { RouteScrollSurface } from "@/components/shared/RouteScrollSurface";

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <RouteScrollSurface>{children}</RouteScrollSurface>;
}
