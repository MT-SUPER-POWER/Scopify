"use client";

import { ChevronsUpDown, Disc3 } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@scopify/ui/shadcn/components/accordion";
import { AspectRatio } from "@scopify/ui/shadcn/components/aspect-ratio";
import { Button } from "@scopify/ui/shadcn/components/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@scopify/ui/shadcn/components/carousel";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@scopify/ui/shadcn/components/collapsible";

import type { ShadcnPreviewProps } from "@/types/component-docs";

export function ShadcnDataStructurePreview({ name }: ShadcnPreviewProps) {
  switch (name) {
    case "shadcn-accordion":
      return (
        <Accordion type="single" collapsible defaultValue="lyrics" className="w-full max-w-md">
          <AccordionItem value="lyrics">
            <AccordionTrigger>歌词信息</AccordionTrigger>
            <AccordionContent>歌词由网易云音乐提供，支持逐字时间轴。</AccordionContent>
          </AccordionItem>
          <AccordionItem value="album">
            <AccordionTrigger>专辑信息</AccordionTrigger>
            <AccordionContent>十一月的萧邦 · 2005</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    case "shadcn-aspect-ratio":
      return (
        <div className="w-full max-w-sm overflow-hidden rounded-xl">
          <AspectRatio
            ratio={16 / 9}
            className="from-primary/30 to-muted flex items-center justify-center bg-linear-to-br"
          >
            <Disc3 className="text-primary size-16" />
          </AspectRatio>
        </div>
      );
    case "shadcn-carousel":
      return (
        <Carousel className="w-full max-w-xs">
          <CarouselContent>
            {["每日推荐", "私人雷达", "新歌速递"].map((title, index) => (
              <CarouselItem key={title}>
                <div className="bg-muted flex aspect-video items-center justify-center rounded-xl border">
                  <div className="text-center">
                    <p className="text-muted-foreground text-xs">0{index + 1}</p>
                    <p className="font-medium">{title}</p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      );
    case "shadcn-collapsible":
      return (
        <Collapsible defaultOpen className="w-full max-w-sm space-y-2">
          <div className="flex items-center justify-between rounded-lg border px-4 py-2">
            <span className="font-medium">即将播放 · 3</span>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="切换队列">
                <ChevronsUpDown />
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="bg-muted/50 space-y-1 rounded-lg border p-2 text-sm">
            <p className="rounded px-2 py-1">晴天 · 周杰伦</p>
            <p className="rounded px-2 py-1">一路向北 · 周杰伦</p>
            <p className="rounded px-2 py-1">搁浅 · 周杰伦</p>
          </CollapsibleContent>
        </Collapsible>
      );
  }
}
