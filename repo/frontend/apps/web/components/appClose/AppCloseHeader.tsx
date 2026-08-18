interface AppCloseHeaderProps {
  subtitle: string;
  title: string;
}

export function AppCloseHeader({ subtitle, title }: AppCloseHeaderProps) {
  return (
    <header className="space-y-2 text-center">
      <h1 id="app-close-title" className="text-2xl font-bold tracking-tight text-content">
        {title}
      </h1>
      <p id="app-close-description" className="text-sm text-content-muted">
        {subtitle}
      </p>
    </header>
  );
}
