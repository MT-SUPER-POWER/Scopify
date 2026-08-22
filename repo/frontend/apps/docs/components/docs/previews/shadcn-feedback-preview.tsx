"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@scopify/ui/shadcn/components/alert";
import { Button } from "@scopify/ui/shadcn/components/button";
import { Progress } from "@scopify/ui/shadcn/components/progress";
import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import { Toaster } from "@scopify/ui/shadcn/components/sonner";
import { Spinner } from "@scopify/ui/shadcn/components/spinner";

import type { ShadcnPreviewProps } from "@/types/component-docs";

export function ShadcnFeedbackPreview({ name }: ShadcnPreviewProps) {
  switch (name) {
    case "shadcn-alert":
      return (
        <div className="w-full max-w-md space-y-3">
          <Alert>
            <CheckCircle2 />
            <AlertTitle>下载完成</AlertTitle>
            <AlertDescription>歌曲已保存，可以离线播放。</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>连接中断</AlertTitle>
            <AlertDescription>请检查网络连接后重试。</AlertDescription>
          </Alert>
        </div>
      );
    case "shadcn-progress":
      return (
        <div className="w-full max-w-sm space-y-3">
          <div className="flex justify-between text-sm">
            <span>正在下载歌单</span>
            <span className="text-muted-foreground tabular-nums">68%</span>
          </div>
          <Progress value={68} />
        </div>
      );
    case "shadcn-skeleton":
      return (
        <div className="flex w-full max-w-sm items-center gap-4">
          <Skeleton className="size-14 rounded-full" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      );
    case "shadcn-spinner":
      return (
        <div className="flex items-center gap-3 text-sm">
          <Spinner className="size-5" />
          正在加载音乐库…
        </div>
      );
    case "shadcn-sonner":
      return (
        <>
          <Button onClick={() => toast.success("已添加到我喜欢的音乐")}>显示通知</Button>
          <Toaster position="bottom-center" richColors />
        </>
      );
  }
}
