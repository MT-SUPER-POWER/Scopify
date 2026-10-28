"use client";

import { LoaderCircle, Upload } from "lucide-react";
import { useRef } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@scopify/ui/shadcn/components/tooltip";
import { useI18n } from "@/store/module/i18n";
import type { CloudDriveActionsProps } from "@/types/library/components";

const CLOUD_UPLOAD_ACCEPT = "audio/*,.mp3,.flac,.m4a,.ogg,.wav,.ape,.wma,.aac";

export function CloudDriveActions({ onUpload, uploadProgress }: CloudDriveActionsProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const label = uploadProgress
    ? t("library.cloud.uploading", {
        current: uploadProgress.current,
        percent: uploadProgress.percent,
        total: uploadProgress.total,
      })
    : t("library.cloud.upload");

  return (
    <div className="flex items-center gap-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label}
            disabled={Boolean(uploadProgress)}
            onClick={() => inputRef.current?.click()}
            className="relative inline-flex cursor-pointer items-center justify-center text-content-muted transition-colors hover:text-content disabled:cursor-default"
          >
            {uploadProgress ? (
              <LoaderCircle className="size-7 animate-spin md:size-8" />
            ) : (
              <Upload className="size-7 md:size-8" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8}>
          {label}
        </TooltipContent>
      </Tooltip>
      <input
        ref={inputRef}
        type="file"
        accept={CLOUD_UPLOAD_ACCEPT}
        multiple
        hidden
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          onUpload(files);
        }}
      />
      {uploadProgress && <span className="text-sm text-content-muted tabular-nums">{label}</span>}
    </div>
  );
}
