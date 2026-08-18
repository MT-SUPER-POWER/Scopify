interface LibraryEmptyStateProps {
  description: string;
  title: string;
}

export function LibraryEmptyState({ description, title }: LibraryEmptyStateProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center text-center">
      <p className="text-base font-semibold text-content">{title}</p>
      <p className="mt-2 text-sm text-content-muted">{description}</p>
    </div>
  );
}
