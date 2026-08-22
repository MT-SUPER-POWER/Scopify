import { CreditCard } from "lucide-react";

import { Button } from "@scopify/ui/shadcn/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@scopify/ui/shadcn/components/card";

import {
  ThemePrototypeAccountCard,
  ThemePrototypeUpgradeCard,
} from "@/components/theme-prototype/theme-prototype-cards-forms";
import { ThemePrototypeCardsCalendar } from "@/components/theme-prototype/theme-prototype-cards-calendar";
import { ThemePrototypeCardsExercise } from "@/components/theme-prototype/theme-prototype-cards-exercise";
import { ThemePrototypeCardsMetrics } from "@/components/theme-prototype/theme-prototype-cards-metrics";

export function ThemePrototypeCardsShowcase() {
  return (
    <div className="bg-background text-foreground min-h-full min-w-[1120px] p-4 pt-1">
      <div className="grid grid-cols-[1.25fr_1fr] gap-4">
        <div className="space-y-4">
          <ThemePrototypeCardsMetrics />
          <div className="grid grid-cols-2 items-start gap-4">
            <ThemePrototypeUpgradeCard />
            <ThemePrototypeAccountCard />
          </div>
        </div>
        <div className="space-y-4">
          <ThemePrototypeCardsCalendar />
          <ThemePrototypeCardsExercise />
          <PaymentCard />
        </div>
      </div>
    </div>
  );
}

function PaymentCard() {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Payments</CardTitle>
        <CardDescription>Manage payment methods and invoices.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <span className="bg-primary text-primary-foreground grid size-11 place-items-center rounded-lg">
          <CreditCard />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">•••• 4242</p>
          <p className="text-muted-foreground text-sm">Expires 12/28</p>
        </div>
        <Button variant="outline">Manage</Button>
      </CardContent>
    </Card>
  );
}
