"use client";

import { AtSign, Search } from "lucide-react";
import { useState } from "react";

import { Input } from "@scopify/ui/shadcn/components/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@scopify/ui/shadcn/components/input-group";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@scopify/ui/shadcn/components/input-otp";
import { Label } from "@scopify/ui/shadcn/components/label";
import { Textarea } from "@scopify/ui/shadcn/components/textarea";

import type { ShadcnPreviewProps } from "@/types/component-docs";

export function ShadcnFormInputPreview({ name }: ShadcnPreviewProps) {
  const [otp, setOtp] = useState("128906");

  switch (name) {
    case "shadcn-input":
      return (
        <div className="w-full max-w-sm space-y-2">
          <Label htmlFor="preview-email">邮箱</Label>
          <Input id="preview-email" type="email" placeholder="listener@scopify.app" />
        </div>
      );
    case "shadcn-textarea":
      return (
        <div className="w-full max-w-sm space-y-2">
          <Label htmlFor="preview-description">歌单简介</Label>
          <Textarea id="preview-description" placeholder="写下这个歌单的故事……" />
        </div>
      );
    case "shadcn-label":
      return (
        <div className="w-full max-w-sm space-y-2">
          <Label htmlFor="preview-search">搜索音乐</Label>
          <Input id="preview-search" placeholder="歌曲、艺人或专辑" />
        </div>
      );
    case "shadcn-input-group":
      return (
        <InputGroup className="w-full max-w-sm">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput placeholder="搜索曲库" />
          <InputGroupAddon align="inline-end">
            <InputGroupText>⌘ K</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      );
    case "shadcn-input-otp":
      return (
        <div className="space-y-3 text-center">
          <Label>输入六位验证码</Label>
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <p className="text-muted-foreground flex items-center justify-center gap-1 text-xs">
            <AtSign className="size-3" /> 已发送到你的邮箱
          </p>
        </div>
      );
  }
}
