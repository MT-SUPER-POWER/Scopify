"use client";

import { useForm } from "react-hook-form";

import { Button } from "@scopify/ui/shadcn/components/button";
import { Field, FieldDescription, FieldLabel } from "@scopify/ui/shadcn/components/field";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@scopify/ui/shadcn/components/form";
import { Input } from "@scopify/ui/shadcn/components/input";

import type { ShadcnPreviewProps } from "@/types/component-docs";

export function ShadcnFormFieldPreview({ name }: ShadcnPreviewProps) {
  const form = useForm({ defaultValues: { playlist: "晚间漫游" } });

  switch (name) {
    case "shadcn-field":
      return (
        <Field className="w-full max-w-sm">
          <FieldLabel htmlFor="preview-playlist-name">歌单名称</FieldLabel>
          <Input id="preview-playlist-name" defaultValue="晚间漫游" />
          <FieldDescription>名称会显示在你的公开主页中。</FieldDescription>
        </Field>
      );
    case "shadcn-form":
      return (
        <Form {...form}>
          <form className="w-full max-w-sm space-y-4" onSubmit={form.handleSubmit(() => undefined)}>
            <FormField
              control={form.control}
              name="playlist"
              rules={{ required: "请输入歌单名称" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>歌单名称</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>使用 React Hook Form 管理字段状态。</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="sm">
              保存歌单
            </Button>
          </form>
        </Form>
      );
  }
}
