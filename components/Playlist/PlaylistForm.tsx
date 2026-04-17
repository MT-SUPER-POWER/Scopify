import { Image as ImageIcon } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
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
  // const [tags, setTags] = useState<string[]>([]); // 简化处理，实际可能需要下拉多选组件
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始化数据
  useEffect(() => {
    if (open) {
      setName(initialData?.name || "");
      setDescription(initialData?.desc || "");
      // setTags(initialData?.tags || []);
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
    await onConfirm({ name, desc: description, coverFile });
    setLoading(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      {/* 使用模糊背景还原截图质感 */}
      <AlertDialogOverlay className="bg-black/40 backdrop-blur-md" />
      <AlertDialogContent className="bg-[#282828]/95 border border-white/10 shadow-2xl rounded-xl w-150 max-w-[90vw] p-6 flex flex-col pointer-events-auto">
        <AlertDialogHeader className="mb-4">
          <AlertDialogTitle className="text-xl font-bold text-white tracking-tight text-left">
            {t("playlist.form.editTitle")}
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="flex gap-6 mt-2">
          {/* 左侧表单区 */}
          <div className="flex-1 flex flex-col gap-4">
            {/* 名称输入 */}
            <div className="relative">
              <input
                value={name}
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("playlist.form.namePlaceholder")}
                className="w-full bg-white/10 text-white placeholder:text-[#b3b3b3] px-3 py-2 rounded-md outline-none focus:ring-1 focus:ring-white/30 transition-all text-sm"
              />
              <span className="absolute right-2 top-2 text-xs text-[#b3b3b3]">
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
                className="w-full bg-white/10 text-white placeholder:text-[#b3b3b3] px-3 py-2 rounded-md outline-none focus:ring-1 focus:ring-white/30 transition-all text-sm resize-none"
              />
              <span className="absolute right-2 bottom-2 text-xs text-[#b3b3b3]">
                {description.length}/300
              </span>
            </div>
          </div>

          {/* 右侧封面区 */}
          <div className="w-45 shrink-0">
            <div
              className="relative w-full aspect-square rounded-md overflow-hidden bg-white/10 group cursor-pointer flex items-center justify-center border border-white/5"
              onClick={() => fileInputRef.current?.click()}
            >
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={t("playlist.form.coverAlt")}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-12 h-12 text-[#b3b3b3]" />
              )}

              {/* 悬浮遮罩 */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                <ImageIcon className="w-8 h-8 text-white mb-2" />
                <span className="text-white text-sm font-medium">
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
        <AlertDialogFooter className="mt-8 flex gap-3 sm:justify-end w-full">
          <button
            onClick={onCancel}
            className="px-6 py-2 rounded-full bg-transparent border border-[#727272] hover:border-white text-white font-bold text-sm transition-all"
          >
            {t("common.action.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            className="px-6 py-2 rounded-full bg-[#1ed760] disabled:opacity-50 hover:bg-[#1fdf64] text-black font-bold text-sm transition-all"
          >
            {loading ? t("common.action.saving") : t("common.action.save")}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
