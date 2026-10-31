import { LoggedInBackground } from "./_components/LoggedInBackground";

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen bg-surface-raised px-6 pt-8 pb-28 md:px-10">
      <LoggedInBackground />
      <div className="relative z-10 mx-auto w-full max-w-7xl">{children}</div>
    </main>
  );
}
