import { ShortcutCommandIcon } from "@/components/shortcuts/ShortcutCommandIcon";
import { ShortcutKeycaps } from "@/components/shortcuts/ShortcutKeycaps";
import { useI18n } from "@/store/module/i18n";
import type { ShortcutHelpCommand } from "@/types/components/shortcuts";

interface ShortcutHelpSectionProps {
  commands: ShortcutHelpCommand[];
  title: string;
}

export function ShortcutHelpSection({ commands, title }: ShortcutHelpSectionProps) {
  const { t } = useI18n();

  return (
    <section>
      <h3 className="mb-2 text-[13px] font-semibold tracking-normal text-[#7d7d7d] uppercase">
        {title}
      </h3>
      <div>
        {commands.map((command) => (
          <div
            key={command.id}
            className="grid min-h-9 grid-cols-[minmax(0,1fr)_auto] items-center gap-6 px-1 py-1"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <ShortcutCommandIcon
                commandId={command.id}
                className="size-3.5 shrink-0 text-[#8b8b8b]"
              />
              <span className="truncate text-[15px] leading-5 text-[#d2d2d2]">
                {t(command.labelKey)}
              </span>
            </span>
            <ShortcutKeycaps binding={command.binding} />
          </div>
        ))}
      </div>
    </section>
  );
}
