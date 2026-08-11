interface AppCloseRememberChoiceProps {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}

export function AppCloseRememberChoice({
  checked,
  label,
  onCheckedChange,
}: AppCloseRememberChoiceProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      className="group flex cursor-pointer items-center gap-3 select-none"
      onClick={() => onCheckedChange(!checked)}
    >
      <span
        aria-hidden="true"
        className={`flex size-4 items-center justify-center rounded-sm border transition-colors ${checked ? "border-brand bg-brand" : "border-content-subtle group-hover:border-content"}`}
      >
        {checked ? (
          <svg
            className="text-brand-foreground"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : null}
      </span>
      <span className="text-content-muted group-hover:text-content text-sm transition-colors">
        {label}
      </span>
    </button>
  );
}
