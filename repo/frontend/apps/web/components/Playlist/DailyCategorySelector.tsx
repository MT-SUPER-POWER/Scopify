"use client";

import { Tags } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@scopify/ui/shadcn/components/tooltip";
import { useState } from "react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import {
  useDailyCategoryConfigs,
  useUpdateDailyCategoryConfig,
} from "@/hooks/playlist/useDailyCategoryRecommendations";
import { useDailyCategorySelection } from "@/hooks/playlist/useDailyCategorySelection";
import { useI18n } from "@/store/module/i18n";
import type {
  DailyCategorySelectorBodyProps,
  DailyCategorySelectorProps,
} from "@/types/playlist/components";

export function DailyCategorySelector(props: DailyCategorySelectorProps) {
  const [open, setOpen] = useState(false);
  const { locale } = useI18n();
  const label = locale === "en-US" ? "Choose styles" : locale === "zh-TW" ? "選擇風格" : "选择风格";
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={label}
              className="inline-flex size-9 items-center justify-center rounded-full text-content-muted transition-colors hover:bg-content/10 hover:text-content focus-visible:outline-2 focus-visible:outline-brand"
            >
              <Tags className="size-5" />
            </button>
          </TooltipTrigger>
        </PopoverTrigger>
        <TooltipContent sideOffset={6}>{label}</TooltipContent>
      </Tooltip>
      <PopoverContent
        align="start"
        className="w-[min(34rem,90vw)] border-border bg-surface-overlay text-content"
      >
        {open && (
          <QueryBoundary resetKey={String(props.accountId)} compact>
            <DailyCategorySelectorBody {...props} onClose={() => setOpen(false)} />
          </QueryBoundary>
        )}
      </PopoverContent>
    </Popover>
  );
}

function DailyCategorySelectorBody({
  accountId,
  selected,
  onClose,
}: DailyCategorySelectorBodyProps) {
  const { locale, t } = useI18n();
  const { data: categories } = useDailyCategoryConfigs(accountId);
  const mutation = useUpdateDailyCategoryConfig(accountId);
  const { draft, beginSelection, toggleTag } = useDailyCategorySelection();
  const category = categories?.find(
    (item) => item.categoryId === (draft?.category ?? selected.categoryId),
  );
  const selectedIds = draft?.tags ?? selected.tagVOList.map((tag) => tag.tagId);
  if (!categories)
    return (
      <div className="p-4 text-sm text-content-muted">
        {locale === "en-US" ? "Loading styles…" : "正在加载风格…"}
      </div>
    );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-4" role="tablist">
        {categories.map((item) => (
          <button
            key={item.categoryId}
            type="button"
            role="tab"
            aria-selected={category?.categoryId === item.categoryId}
            onClick={() =>
              beginSelection(
                item.categoryId,
                item.categoryId === selected.categoryId
                  ? selected.tagVOList.map((tag) => tag.tagId)
                  : [],
              )
            }
            className={
              category?.categoryId === item.categoryId
                ? "text-brand"
                : "text-content-muted hover:text-content"
            }
          >
            {item.categoryName}
          </button>
        ))}
      </div>
      <div className="flex max-h-64 flex-wrap gap-2 overflow-y-auto">
        {category?.tagVOList.map((tag) => (
          <button
            key={tag.tagId}
            type="button"
            aria-pressed={selectedIds.includes(tag.tagId)}
            onClick={() => {
              if (!draft)
                beginSelection(
                  selected.categoryId,
                  selectedIds.includes(tag.tagId)
                    ? selectedIds.filter((id) => id !== tag.tagId)
                    : [...selectedIds, tag.tagId],
                );
              else toggleTag(tag.categoryId, tag.tagId);
            }}
            className={
              selectedIds.includes(tag.tagId)
                ? "rounded-full bg-brand/15 px-3 py-1 text-sm text-brand"
                : "rounded-full bg-content/10 px-3 py-1 text-sm text-content-muted hover:bg-content/20"
            }
          >
            {tag.tagName}
          </button>
        ))}
      </div>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-4 py-2 text-sm text-content-muted"
        >
          {t("common.action.cancel")}
        </button>
        <button
          type="button"
          disabled={!draft || draft.tags.length === 0 || mutation.isPending}
          onClick={() => {
            if (!draft) return;
            mutation.mutate(draft, {
              onSuccess: onClose,
              onError: () => toast.error(t("playlist.table.operationFailed")),
            });
          }}
          className="rounded-full bg-brand px-5 py-2 text-sm text-brand-foreground disabled:opacity-50"
        >
          {locale === "en-US" ? "Confirm" : "确认"}
        </button>
      </div>
    </div>
  );
}
