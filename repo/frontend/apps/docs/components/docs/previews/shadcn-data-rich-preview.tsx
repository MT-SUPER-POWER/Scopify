"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@scopify/ui/shadcn/components/chart";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@scopify/ui/shadcn/components/resizable";
import { ScrollArea } from "@scopify/ui/shadcn/components/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@scopify/ui/shadcn/components/table";

import type { ShadcnPreviewProps } from "@/types/component-docs";

const chartData = [
  { day: "周一", plays: 42 },
  { day: "周二", plays: 68 },
  { day: "周三", plays: 54 },
  { day: "周四", plays: 86 },
  { day: "周五", plays: 73 },
];

const chartConfig = {
  plays: { label: "播放次数", color: "var(--primary)" },
} satisfies ChartConfig;

export function ShadcnDataRichPreview({ name }: ShadcnPreviewProps) {
  switch (name) {
    case "shadcn-chart":
      return (
        <ChartContainer config={chartConfig} className="h-56 w-full max-w-lg">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="plays" fill="var(--color-plays)" radius={6} />
          </BarChart>
        </ChartContainer>
      );
    case "shadcn-resizable":
      return (
        <ResizablePanelGroup
          orientation="horizontal"
          className="min-h-48 w-full max-w-lg rounded-lg border"
        >
          <ResizablePanel defaultSize={40}>
            <div className="flex h-full items-center justify-center p-4 font-medium">播放列表</div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={60}>
            <div className="bg-muted/40 flex h-full items-center justify-center p-4">歌词详情</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      );
    case "shadcn-scroll-area":
      return (
        <ScrollArea className="h-52 w-full max-w-sm rounded-lg border p-4">
          <div className="space-y-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span>{String(index + 1).padStart(2, "0")} · 推荐歌曲</span>
                <span className="text-muted-foreground">03:{20 + index}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      );
    case "shadcn-table":
      return (
        <div className="w-full max-w-lg rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>歌曲</TableHead>
                <TableHead>艺人</TableHead>
                <TableHead className="text-right">时长</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ["夜曲", "周杰伦", "03:46"],
                ["晴天", "周杰伦", "04:29"],
                ["一路向北", "周杰伦", "04:55"],
              ].map(([song, artist, duration]) => (
                <TableRow key={song}>
                  <TableCell className="font-medium">{song}</TableCell>
                  <TableCell>{artist}</TableCell>
                  <TableCell className="text-right tabular-nums">{duration}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
  }
}
