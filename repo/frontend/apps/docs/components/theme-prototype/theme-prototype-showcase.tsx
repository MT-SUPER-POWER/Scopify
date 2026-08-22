"use client";

import { ArrowUpRight, Bell, CreditCard, MoreHorizontal, Search, Users } from "lucide-react";

import { Badge } from "@scopify/ui/shadcn/components/badge";
import { Button } from "@scopify/ui/shadcn/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@scopify/ui/shadcn/components/card";
import { Input } from "@scopify/ui/shadcn/components/input";
import { Progress } from "@scopify/ui/shadcn/components/progress";
import { Separator } from "@scopify/ui/shadcn/components/separator";
import { Switch } from "@scopify/ui/shadcn/components/switch";

export function ThemePrototypeShowcase() {
  return (
    <div className="bg-background text-foreground min-h-full p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge variant="secondary">Live preview</Badge>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Dashboard overview</h1>
            <p className="text-muted-foreground text-sm">
              所有内容都在同一个 Shadcn 主题作用域中。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" aria-label="通知">
              <Bell />
            </Button>
            <Button>
              Create report <ArrowUpRight />
            </Button>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {(
            [
              ["Total revenue", "$15,231.89", "+20.1%", CreditCard],
              ["Subscriptions", "+2,350", "+18.0%", Users],
              ["Conversion", "12.8%", "+4.2%", ArrowUpRight],
            ] as const
          ).map(([label, value, trend, Icon]) => (
            <Card key={String(label)}>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{String(label)}</CardTitle>
                <Icon className="text-muted-foreground size-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{String(value)}</div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {String(trend)} from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Revenue</CardTitle>
                <p className="text-muted-foreground mt-1 text-sm">Monthly performance</p>
              </div>
              <Button size="icon" variant="ghost" aria-label="更多">
                <MoreHorizontal />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex h-56 items-end gap-3 border-b">
                {[36, 52, 45, 68, 62, 82, 74, 92, 70, 86, 78, 96].map((height, index) => (
                  <div className="flex h-full flex-1 items-end" key={`${height}-${index}`}>
                    <span
                      className="bg-primary/85 hover:bg-primary w-full rounded-t-sm transition"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="text-muted-foreground mt-3 flex justify-between text-xs">
                <span>Jan</span>
                <span>Apr</span>
                <span>Jul</span>
                <span>Oct</span>
                <span>Dec</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input className="pl-9" placeholder="Search customers" />
              </div>
              <Separator />
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>
                  <strong className="block font-medium">Weekly report</strong>
                  <span className="text-muted-foreground text-xs">Send every Monday</span>
                </span>
                <Switch defaultChecked />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>
                  <strong className="block font-medium">New activity</strong>
                  <span className="text-muted-foreground text-xs">Show desktop alerts</span>
                </span>
                <Switch />
              </label>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Monthly target</span>
                  <span>72%</span>
                </div>
                <Progress value={72} />
              </div>
              <Button className="w-full" variant="secondary">
                Save settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
