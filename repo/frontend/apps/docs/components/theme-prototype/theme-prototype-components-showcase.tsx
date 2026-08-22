"use client";

import { Bell, CheckCircle2, Search, Settings2 } from "lucide-react";

import { Badge } from "@scopify/ui/shadcn/components/badge";
import { Button } from "@scopify/ui/shadcn/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@scopify/ui/shadcn/components/card";
import { Input } from "@scopify/ui/shadcn/components/input";
import { Progress } from "@scopify/ui/shadcn/components/progress";
import { Separator } from "@scopify/ui/shadcn/components/separator";
import { Switch } from "@scopify/ui/shadcn/components/switch";

export function ThemePrototypeComponentsShowcase() {
  return (
    <div className="bg-background text-foreground min-h-full p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Components</h1>
          <p className="text-muted-foreground mt-1 text-sm">检查交互语义、层级和边界是否一致。</p>
        </div>

        <section className="space-y-3">
          <h2 className="border-b pb-2 text-sm font-medium">Buttons & badges</h2>
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Delete</Button>
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Create an account</CardTitle>
              <p className="text-muted-foreground text-sm">Enter your details to continue.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="grid gap-2 text-sm">
                Email
                <div className="relative">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input className="pl-9" placeholder="name@example.com" />
                </div>
              </label>
              <label className="grid gap-2 text-sm">
                Password
                <Input type="password" defaultValue="theme-editor" />
              </label>
              <Button className="w-full">Create account</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <p className="text-muted-foreground text-sm">Choose what you want to receive.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center justify-between gap-4 text-sm">
                <span>
                  <strong className="block font-medium">Product updates</strong>
                  <span className="text-muted-foreground text-xs">New components and releases</span>
                </span>
                <Switch defaultChecked />
              </label>
              <Separator />
              <label className="flex items-center justify-between gap-4 text-sm">
                <span>
                  <strong className="block font-medium">Activity</strong>
                  <span className="text-muted-foreground text-xs">Weekly account summary</span>
                </span>
                <Switch />
              </label>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Profile completion</span>
                  <span>68%</span>
                </div>
                <Progress value={68} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="flex flex-wrap items-center gap-4 p-5">
            <span className="bg-primary text-primary-foreground grid size-10 place-items-center rounded-full">
              <Bell className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-sm">Theme applied successfully</strong>
              <span className="text-muted-foreground text-xs">
                All Shadcn preview scopes now use this profile.
              </span>
            </span>
            <Badge variant="secondary">
              <CheckCircle2 /> Active
            </Badge>
            <Button size="icon" variant="ghost" aria-label="设置">
              <Settings2 />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
