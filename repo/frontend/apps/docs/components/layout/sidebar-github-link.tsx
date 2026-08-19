const SCOPIFY_REPOSITORY_URL = "https://github.com/MT-SUPER-POWER/Scopify";

export function SidebarGitHubLink() {
  return (
    <a
      className="text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
      href={SCOPIFY_REPOSITORY_URL}
      rel="noreferrer"
      target="_blank"
    >
      <svg aria-hidden="true" className="size-4 fill-current" viewBox="0 0 24 24">
        <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.4c.58.1.79-.25.79-.56v-2.02c-3.22.7-3.9-1.37-3.9-1.37-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.57-.3-5.27-1.29-5.27-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.16 1.18a10.98 10.98 0 0 1 5.76 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.71 5.39-5.29 5.68.42.36.79 1.07.79 2.16v3.2c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
      </svg>
      <span>GitHub 仓库</span>
    </a>
  );
}
