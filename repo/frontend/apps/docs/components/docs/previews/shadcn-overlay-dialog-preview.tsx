"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@scopify/ui/shadcn/components/alert-dialog";
import { Button } from "@scopify/ui/shadcn/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@scopify/ui/shadcn/components/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@scopify/ui/shadcn/components/drawer";
import { Input } from "@scopify/ui/shadcn/components/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@scopify/ui/shadcn/components/sheet";

import type { ShadcnPreviewProps } from "@/types/component-docs";

export function ShadcnOverlayDialogPreview({ name }: ShadcnPreviewProps) {
  switch (name) {
    case "shadcn-alert-dialog":
      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">清空播放队列</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认清空播放队列？</AlertDialogTitle>
              <AlertDialogDescription>此操作会移除队列中的全部歌曲。</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction>确认清空</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    case "shadcn-dialog":
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button>创建歌单</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建新歌单</DialogTitle>
              <DialogDescription>输入名称后即可创建私人歌单。</DialogDescription>
            </DialogHeader>
            <Input placeholder="歌单名称" />
            <DialogFooter>
              <Button>创建</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    case "shadcn-drawer":
      return (
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline">打开播放队列</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>当前播放队列</DrawerTitle>
              <DrawerDescription>接下来将播放 12 首歌曲。</DrawerDescription>
            </DrawerHeader>
            <div className="mx-auto w-full max-w-sm px-4 py-6 text-sm">晴天 · 周杰伦</div>
            <DrawerFooter>
              <Button>开始播放</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      );
    case "shadcn-sheet":
      return (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">查看歌曲详情</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>夜曲</SheetTitle>
              <SheetDescription>周杰伦 · 十一月的萧邦</SheetDescription>
            </SheetHeader>
            <div className="px-4 text-sm leading-7">一群嗜血的蚂蚁，被腐肉所吸引……</div>
          </SheetContent>
        </Sheet>
      );
  }
}
