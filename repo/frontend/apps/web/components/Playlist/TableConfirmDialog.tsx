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
      <AlertDialogOverlay className="backdrop-blur-sm" />

      <AlertDialogContent
        className={cn(
          "w-96 rounded-xl border-none bg-surface-overlay p-8 shadow-floating",
          "flex flex-col",
        )}
      >
        {/* text-center 覆盖 shadcn AlertDialogHeader 默认的 text-left */}
        <AlertDialogHeader className="mb-8 w-full space-y-2">
          <AlertDialogTitle className="w-full text-center text-2xl font-bold tracking-tight text-content">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-content-muted">
            {content}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* sm:flex-col 覆盖 shadcn Footer 默认在宽屏变 flex-row 的行为 */}
        <AlertDialogFooter className="flex w-full flex-col gap-4 sm:flex-col">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full rounded-full bg-brand py-3.5 text-base font-bold text-brand-foreground transition-all hover:bg-brand-hover"
          >
            {confirmText}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-full border border-content-muted bg-transparent py-3.5 text-base font-bold text-content transition-all hover:border-content"
          >
            {cancelText}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
