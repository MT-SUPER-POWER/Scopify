interface LibraryEmptyStateProps {
  description: string;
  title: string;
}

export function LibraryEmptyState({ description, title }: LibraryEmptyStateProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center text-center">
      <p className="text-content text-base font-semibold">{title}</p>
      <p className="text-content-muted mt-2 text-sm">{description}</p>
    </div>
  );
}
