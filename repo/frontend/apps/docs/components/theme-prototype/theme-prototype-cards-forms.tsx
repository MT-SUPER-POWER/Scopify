import { GitFork } from "lucide-react";

import { Button } from "@scopify/ui/shadcn/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@scopify/ui/shadcn/components/card";
import { Input } from "@scopify/ui/shadcn/components/input";
import { Label } from "@scopify/ui/shadcn/components/label";
import { RadioGroup, RadioGroupItem } from "@scopify/ui/shadcn/components/radio-group";

import type { ThemePrototypeFieldProps, ThemePrototypePlanProps } from "@/types/theme-lab";

export function ThemePrototypeUpgradeCard() {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-lg">Upgrade your subscription</CardTitle>
        <CardDescription>
          You are currently on the free plan. Upgrade to the pro plan to get access to all features.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" placeholder="Evil Rabbit" />
          <Field label="Email" placeholder="example@acme.com" />
        </div>
        <div className="space-y-2">
          <Label>Card Number</Label>
          <div className="grid grid-cols-[1fr_80px_60px] gap-3">
            <Input placeholder="1234 1234 1234 1234" />
            <Input placeholder="MM/YY" />
            <Input placeholder="CVC" />
          </div>
        </div>
        <div>
          <Label>Plan</Label>
          <p className="text-muted-foreground mt-1 text-sm">
            Select the plan that best fits your needs.
          </p>
          <RadioGroup className="mt-3 grid grid-cols-2 gap-3" defaultValue="starter">
            <Plan id="starter" label="Starter Plan" description="Perfect for small businesses." />
            <Plan id="pro" label="Pro Plan" description="More features and storage." />
          </RadioGroup>
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button size="sm">Upgrade Plan</Button>
      </CardFooter>
    </Card>
  );
}

export function ThemePrototypeAccountCard() {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>Enter your email below to create your account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-5">
          <Button variant="outline">
            <GitFork /> GitHub
          </Button>
          <Button variant="outline">G&nbsp; Google</Button>
        </div>
        <div className="relative flex items-center py-1">
          <span className="w-full border-t" />
          <span className="bg-card text-muted-foreground absolute left-1/2 -translate-x-1/2 px-2 text-[10px] uppercase">
            Or continue with
          </span>
        </div>
        <Field label="Email" placeholder="m@example.com" />
        <Field label="Password" placeholder="" type="password" />
      </CardContent>
      <CardFooter>
        <Button className="w-full">Create account</Button>
      </CardFooter>
    </Card>
  );
}

function Field({ label, placeholder, type = "text" }: ThemePrototypeFieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input placeholder={placeholder} type={type} />
    </div>
  );
}

function Plan({ description, id, label }: ThemePrototypePlanProps) {
  return (
    <Label className="has-[[data-state=checked]]:border-ring flex items-start gap-3 rounded-lg border p-3">
      <RadioGroupItem id={id} value={id} />
      <span className="font-normal">
        <strong className="block font-medium">{label}</strong>
        <span className="text-muted-foreground text-xs">{description}</span>
      </span>
    </Label>
  );
}
