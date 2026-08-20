"use client";

import { useState } from "react";
import { Bold, ListMusic, Mic2, Radio } from "lucide-react";

import { Calendar } from "@scopify/ui/shadcn/components/calendar";
import { Label } from "@scopify/ui/shadcn/components/label";
import { Slider } from "@scopify/ui/shadcn/components/slider";
import { Switch } from "@scopify/ui/shadcn/components/switch";
import { Toggle } from "@scopify/ui/shadcn/components/toggle";
import { ToggleGroup, ToggleGroupItem } from "@scopify/ui/shadcn/components/toggle-group";

import type { ShadcnPreviewProps } from "@/types/component-docs";

export function ShadcnFormControlPreview({ name }: ShadcnPreviewProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [sliderValue, setSliderValue] = useState([42]);

  switch (name) {
    case "shadcn-calendar":
      return (
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-lg border shadow-sm"
        />
      );
    case "shadcn-slider":
      return (
        <div className="w-full max-w-sm space-y-4">
          <Slider value={sliderValue} onValueChange={setSliderValue} max={100} step={1} />
          <p className="text-muted-foreground text-center text-sm tabular-nums">
            当前值：{sliderValue[0]}
          </p>
        </div>
      );
    case "shadcn-switch":
      return (
        <div className="flex items-center gap-3">
          <Switch id="preview-crossfade" defaultChecked />
          <Label htmlFor="preview-crossfade">启用歌曲淡入淡出</Label>
        </div>
      );
    case "shadcn-toggle":
      return (
        <Toggle aria-label="切换粗体" defaultPressed variant="outline">
          <Bold /> 粗体
        </Toggle>
      );
    case "shadcn-toggle-group":
      return (
        <ToggleGroup type="single" defaultValue="playlist" variant="outline">
          <ToggleGroupItem value="playlist" aria-label="歌单视图">
            <ListMusic />
          </ToggleGroupItem>
          <ToggleGroupItem value="lyrics" aria-label="歌词视图">
            <Mic2 />
          </ToggleGroupItem>
          <ToggleGroupItem value="radio" aria-label="播客视图">
            <Radio />
          </ToggleGroupItem>
        </ToggleGroup>
      );
  }
}
