import { Image as ImageIcon } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { PlaylistTagSelector } from "@/components/Playlist/PlaylistTagSelector";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useI18n } from "@/store/module/i18n";

// 定义表单数据结构
export interface PlaylistFormData {
  name: string;
  desc?: string;
  tags?: string[];
  coverFile?: File | null; // 实际上传的文件对象
}

interface UpdatePlaylistDialogProps {
  open: boolean;
  initialData?: Partial<PlaylistFormData> & { coverUrl?: string };
  onConfirm: (data: PlaylistFormData) => void;
  onCancel: () => void;
}

export function UpdatePlaylistDialog({
  open,
  initialData,
  onConfirm,
  onCancel,
}: UpdatePlaylistDialogProps) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始化数据
  useEffect(() => {
    if (open) {
      setName(initialData?.name || "");
      setDescription(initialData?.desc || "");
      setTags(initialData?.tags || []);
      setCoverUrl(initialData?.coverUrl || "");
      setCoverFile(null);
      setLoading(false);
    }
  }, [open, initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      // 生成本地预览 URL
      setCoverUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    await onConfirm({ name, desc: description, tags, coverFile });
    setLoading(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      {/* 使用模糊背景还原截图质感 */}
      <AlertDialogOverlay className="backdrop-blur-md" />
      <AlertDialogContent className="pointer-events-auto flex w-150 max-w-[90vw] flex-col rounded-xl border bg-surface-overlay p-6 shadow-floating">
        <AlertDialogHeader className="mb-4">
          <AlertDialogTitle className="text-left text-xl font-bold tracking-tight text-content">
            {t("playlist.form.editTitle")}
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="mt-2 flex gap-6">
          {/* 左侧表单区 */}
          <div className="flex flex-1 flex-col gap-4">
            {/* 名称输入 */}
            <div className="relative">
              <input
                value={name}
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("playlist.form.namePlaceholder")}
                className="w-full rounded-md bg-content/10 px-3 py-2 text-sm text-content transition-all outline-none placeholder:text-content-muted focus:ring-1 focus:ring-brand/50"
              />
              <span className="absolute top-2 right-2 text-xs text-content-muted">
                {name.length}/40
              </span>
            </div>

            {/* 简介输入 */}
            <div className="relative">
              <textarea
                value={description}
                maxLength={300}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("playlist.form.descriptionPlaceholder")}
                rows={4}
                className="w-full resize-none rounded-md bg-content/10 px-3 py-2 text-sm text-content transition-all outline-none placeholder:text-content-muted focus:ring-1 focus:ring-brand/50"
              />
              <span className="absolute right-2 bottom-2 text-xs text-content-muted">
                {description.length}/300
              </span>
            </div>

            <PlaylistTagSelector value={tags} maxSelected={3} onChange={setTags} />
          </div>

          {/* 右侧封面区 */}
          <div className="w-45 shrink-0">
            <div
              className="group relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-md border border-content/10 bg-content/10"
              onClick={() => fileInputRef.current?.click()}
            >
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={t("playlist.form.coverAlt")}
                  className="size-full object-cover"
                />
              ) : (
                <ImageIcon className="size-12 text-content-muted" />
              )}

              {/* 悬浮遮罩 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-overlay opacity-0 transition-opacity group-hover:opacity-100">
                <ImageIcon className="mb-2 size-8 text-overlay-foreground" />
                <span className="text-sm font-medium text-overlay-foreground">
                  {t("playlist.form.replaceImage")}
                </span>
              </div>
            </div>
            {/* 隐藏的文件输入框 */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg, image/png, image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* 底部按钮区 */}
        <AlertDialogFooter className="mt-8 flex w-full gap-3 sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-content-muted bg-transparent px-6 py-2 text-sm font-bold text-content transition-all hover:border-content"
          >
            {t("common.action.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            className="rounded-full bg-brand px-6 py-2 text-sm font-bold text-brand-foreground transition-all hover:bg-brand-hover disabled:opacity-50"
          >
            {loading ? t("common.action.saving") : t("common.action.save")}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
