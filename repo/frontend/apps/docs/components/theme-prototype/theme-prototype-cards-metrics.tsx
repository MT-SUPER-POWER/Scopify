import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@scopify/ui/shadcn/components/card";

import type { ThemePrototypeMetricCardProps } from "@/types/theme-lab";

const REVENUE_LINE = "M4 70 C35 55 48 54 70 66 S125 74 154 73 S205 59 222 12";
const SUBSCRIPTION_LINE = "M0 78 C38 69 52 48 86 22 S124 8 146 58 S178 72 196 36 S224 70 256 68";

export function ThemePrototypeCardsMetrics() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <MetricCard
        description="+20.1% from last month"
        path={REVENUE_LINE}
        title="Total Revenue"
        value="$15,231.89"
      />
      <MetricCard
        description="+180.1% from last month"
        path={SUBSCRIPTION_LINE}
        title="Subscriptions"
        value="+2,350"
      />
    </div>
  );
}

function MetricCard({ description, path, title, value }: ThemePrototypeMetricCardProps) {
  return (
    <Card className="min-h-64 overflow-hidden py-0 shadow-none">
      <CardHeader className="pt-7">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto px-3 pb-5">
        <svg aria-hidden="true" className="h-24 w-full overflow-visible" viewBox="0 0 256 90">
          <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2" />
          <circle cx="70" cy="66" fill="var(--background)" r="3" stroke="var(--primary)" />
          <circle cx="222" cy="12" fill="var(--background)" r="3" stroke="var(--primary)" />
        </svg>
      </CardContent>
    </Card>
  );
}
