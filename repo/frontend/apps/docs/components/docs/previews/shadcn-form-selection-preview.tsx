"use client";

import { Checkbox } from "@scopify/ui/shadcn/components/checkbox";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@scopify/ui/shadcn/components/combobox";
import { Label } from "@scopify/ui/shadcn/components/label";
import { NativeSelect, NativeSelectOption } from "@scopify/ui/shadcn/components/native-select";
import { RadioGroup, RadioGroupItem } from "@scopify/ui/shadcn/components/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@scopify/ui/shadcn/components/select";

import type { ShadcnPreviewProps } from "@/types/component-docs";

export function ShadcnFormSelectionPreview({ name }: ShadcnPreviewProps) {
  switch (name) {
    case "shadcn-checkbox":
      return (
        <div className="flex items-start gap-3">
          <Checkbox id="preview-download" defaultChecked />
          <div className="grid gap-1.5">
            <Label htmlFor="preview-download">自动下载喜欢的歌曲</Label>
            <p className="text-muted-foreground text-sm">仅在 Wi-Fi 环境下执行</p>
          </div>
        </div>
      );
    case "shadcn-radio-group":
      return (
        <RadioGroup defaultValue="lossless" className="w-full max-w-xs">
          {[
            ["standard", "标准音质"],
            ["high", "极高音质"],
            ["lossless", "无损音质"],
          ].map(([value, label]) => (
            <div key={value} className="flex items-center gap-3">
              <RadioGroupItem value={value} id={`quality-${value}`} />
              <Label htmlFor={`quality-${value}`}>{label}</Label>
            </div>
          ))}
        </RadioGroup>
      );
    case "shadcn-select":
      return (
        <Select defaultValue="daily">
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="选择歌单" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">每日推荐</SelectItem>
            <SelectItem value="liked">我喜欢的音乐</SelectItem>
            <SelectItem value="recent">最近播放</SelectItem>
          </SelectContent>
        </Select>
      );
    case "shadcn-native-select":
      return (
        <NativeSelect defaultValue="high" className="w-full max-w-xs">
          <NativeSelectOption value="standard">标准音质</NativeSelectOption>
          <NativeSelectOption value="high">极高音质</NativeSelectOption>
          <NativeSelectOption value="lossless">无损音质</NativeSelectOption>
        </NativeSelect>
      );
    case "shadcn-combobox": {
      const genres = ["流行", "摇滚", "爵士", "电子"];
      return (
        <Combobox items={genres} defaultValue="流行">
          <ComboboxInput className="w-full max-w-xs" placeholder="搜索音乐风格" />
          <ComboboxContent>
            <ComboboxEmpty>没有匹配的风格</ComboboxEmpty>
            <ComboboxList>
              {genres.map((genre) => (
                <ComboboxItem key={genre} value={genre}>
                  {genre}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      );
    }
  }
}
