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
      <AlertDialogOverlay className="bg-black/40 backdrop-blur-md" />
      <AlertDialogContent className="pointer-events-auto flex w-150 max-w-[90vw] flex-col rounded-xl border border-white/10 bg-[#282828]/95 p-6 shadow-2xl">
        <AlertDialogHeader className="mb-4">
          <AlertDialogTitle className="text-left text-xl font-bold tracking-tight text-white">
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
                className="w-full rounded-md bg-white/10 px-3 py-2 text-sm text-white transition-all outline-none placeholder:text-[#b3b3b3] focus:ring-1 focus:ring-white/30"
              />
              <span className="absolute top-2 right-2 text-xs text-[#b3b3b3]">
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
                className="w-full resize-none rounded-md bg-white/10 px-3 py-2 text-sm text-white transition-all outline-none placeholder:text-[#b3b3b3] focus:ring-1 focus:ring-white/30"
              />
              <span className="absolute right-2 bottom-2 text-xs text-[#b3b3b3]">
                {description.length}/300
              </span>
            </div>

            <PlaylistTagSelector value={tags} maxSelected={3} onChange={setTags} />
          </div>

          {/* 右侧封面区 */}
          <div className="w-45 shrink-0">
            <div
              className="group relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-md border border-white/5 bg-white/10"
              onClick={() => fileInputRef.current?.click()}
            >
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={t("playlist.form.coverAlt")}
                  className="size-full object-cover"
                />
              ) : (
                <ImageIcon className="size-12 text-[#b3b3b3]" />
              )}

              {/* 悬浮遮罩 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                <ImageIcon className="mb-2 size-8 text-white" />
                <span className="text-sm font-medium text-white">
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
            className="rounded-full border border-[#727272] bg-transparent px-6 py-2 text-sm font-bold text-white transition-all hover:border-white"
          >
            {t("common.action.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            className="rounded-full bg-[#1ed760] px-6 py-2 text-sm font-bold text-black transition-all hover:bg-[#1fdf64] disabled:opacity-50"
          >
            {loading ? t("common.action.saving") : t("common.action.save")}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
