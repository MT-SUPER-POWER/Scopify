interface AppCloseHeaderProps {
  subtitle: string;
  title: string;
}

export function AppCloseHeader({ subtitle, title }: AppCloseHeaderProps) {
  return (
    <header className="space-y-2 text-center">
      <h1 id="app-close-title" className="text-content text-2xl font-bold tracking-tight">
        {title}
      </h1>
      <p id="app-close-description" className="text-content-muted text-sm">
        {subtitle}
      </p>
    </header>
  );
}
