import { ShortcutCommandIcon } from "@/components/shortcuts/ShortcutCommandIcon";
import { ShortcutKeycaps } from "@/components/shortcuts/ShortcutKeycaps";
import { useTranslation } from "react-i18next";

import type { ShortcutHelpSectionProps } from "@/types/shortcuts/components";

export function ShortcutHelpSection({ commands, title }: ShortcutHelpSectionProps) {
  const { t } = useTranslation();

  return (
    <section>
      <h3 className="mb-2 text-[13px] font-semibold tracking-normal text-content-muted uppercase">
        {title}
      </h3>
      <div>
        {commands.map((command) => (
          <div
            key={command.id}
            className="grid min-h-9 grid-cols-[minmax(0,1fr)_auto] items-center gap-6 p-1"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <ShortcutCommandIcon
                commandId={command.id}
                className="size-3.5 shrink-0 text-content-muted"
              />
              <span className="truncate text-[15px] leading-5 text-content">
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
