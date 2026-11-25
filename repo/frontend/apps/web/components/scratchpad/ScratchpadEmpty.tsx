import type { ScratchpadEmptyProps } from "@/types/scratchpad/components";

export function ScratchpadEmpty({
  icon: Icon,
  title,
  description,
  children,
}: ScratchpadEmptyProps) {
  return (
    <div className="scratchpad-empty">
      <Icon aria-hidden />
      <p>{title}</p>
      {description && <p>{description}</p>}
      {children}
    </div>
  );
}
