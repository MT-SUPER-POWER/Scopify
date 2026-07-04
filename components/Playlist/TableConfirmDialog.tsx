import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export function ConfirmDialogShandCN({
  open,
  title,
  content,
  onConfirm,
  onCancel,
  confirmText = "确认",
  cancelText = "取消",
}: {
  open: boolean;
  title: string;
  content: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogOverlay className="bg-black/60 backdrop-blur-sm" />

      <AlertDialogContent
        className={cn("w-96 rounded-xl border-none bg-[#282828] p-8 shadow-2xl", "flex flex-col")}
      >
        {/* text-center 覆盖 shadcn AlertDialogHeader 默认的 text-left */}
        <AlertDialogHeader className="mb-8 w-full space-y-2">
          <AlertDialogTitle className="w-full text-center text-2xl font-bold tracking-tight text-white">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-[#b3b3b3]">
            {content}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* sm:flex-col 覆盖 shadcn Footer 默认在宽屏变 flex-row 的行为 */}
        <AlertDialogFooter className="flex w-full flex-col gap-4 sm:flex-col">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full rounded-full bg-[#1ed760] py-3.5 text-base font-bold text-black transition-all hover:bg-[#1fdf64]"
          >
            {confirmText}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-full border border-[#727272] bg-transparent py-3.5 text-base font-bold text-white transition-all hover:border-white"
          >
            {cancelText}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
