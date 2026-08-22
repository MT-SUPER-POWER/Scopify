"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Bell, Download, LoaderCircle, MoreHorizontal, Plus } from "lucide-react";

import { Button, buttonVariants } from "@scopify/ui/shadcn/components/button";
import { ButtonGroup, ButtonGroupSeparator } from "@scopify/ui/shadcn/components/button-group";

import type { ShadcnButtonExampleProps } from "@/types/component-docs";

function BasicExample() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button>保存歌单</Button>
      <Button variant="secondary">稍后处理</Button>
      <Button variant="outline">取消</Button>
    </div>
  );
}

function VariantsExample() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button>默认</Button>
      <Button variant="destructive">危险</Button>
      <Button variant="outline">描边</Button>
      <Button variant="secondary">次要</Button>
      <Button variant="ghost">幽灵</Button>
      <Button variant="link">链接</Button>
    </div>
  );
}

function SizesExample() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="xs">超小</Button>
      <Button size="sm">小</Button>
      <Button>默认</Button>
      <Button size="lg">大</Button>
      <Button size="icon-xs" aria-label="添加（超小）">
        <Plus />
      </Button>
      <Button size="icon-sm" aria-label="添加（小）">
        <Plus />
      </Button>
      <Button size="icon" aria-label="添加">
        <Plus />
      </Button>
      <Button size="icon-lg" aria-label="添加（大）">
        <Plus />
      </Button>
    </div>
  );
}

function IconsExample() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button>
        <Download />
        下载
      </Button>
      <Button variant="outline">
        下一步
        <ArrowRight />
      </Button>
      <Button size="icon" variant="ghost" aria-label="打开通知">
        <Bell />
      </Button>
    </div>
  );
}

function LoadingExample() {
  return (
    <Button disabled aria-busy="true">
      <LoaderCircle className="animate-spin" />
      保存中
    </Button>
  );
}

function DisabledExample() {
  return <Button disabled>暂不可用</Button>;
}

function GroupExample() {
  return (
    <ButtonGroup>
      <Button variant="outline" size="sm">
        上一首
      </Button>
      <Button size="sm">播放</Button>
      <ButtonGroupSeparator />
      <Button variant="outline" size="icon-sm" aria-label="更多操作">
        <MoreHorizontal />
      </Button>
    </ButtonGroup>
  );
}

function LinkExample() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button asChild variant="outline">
        <Link href="/docs/ui-library/shadcn/basic/card">查看 Card 文档</Link>
      </Button>
      <Link className={buttonVariants({ variant: "link", size: "sm" })} href="/library">
        打开媒体库
      </Link>
    </div>
  );
}

function ControlledExample() {
  const [isSaving, setIsSaving] = useState(false);

  function handleSave() {
    setIsSaving(true);
    window.setTimeout(() => setIsSaving(false), 800);
  }

  return (
    <Button className="min-w-28" disabled={isSaving} aria-busy={isSaving} onClick={handleSave}>
      {isSaving ? <LoaderCircle className="animate-spin" /> : null}
      {isSaving ? "保存中" : "保存歌单"}
    </Button>
  );
}

export function ShadcnButtonExample({ example }: ShadcnButtonExampleProps) {
  switch (example) {
    case "basic":
      return <BasicExample />;
    case "variants":
      return <VariantsExample />;
    case "sizes":
      return <SizesExample />;
    case "icons":
      return <IconsExample />;
    case "loading":
      return <LoadingExample />;
    case "disabled":
      return <DisabledExample />;
    case "group":
      return <GroupExample />;
    case "link":
      return <LinkExample />;
    case "controlled":
      return <ControlledExample />;
  }
}
