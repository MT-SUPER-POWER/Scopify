import { BookOpen, GitFork, PanelsTopLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@scopify/ui/shadcn/components/button";

import scopifyLogo from "@/assets/logo.png";

export function ThemePrototypeHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
      <Link className="flex items-center gap-2" href="/docs/shadcn">
        <Image alt="Scopify" className="size-6 rounded-full" src={scopifyLogo} />
        <span className="font-bold">Scopify Theme Lab</span>
        <span className="bg-muted text-muted-foreground ml-1 rounded-full px-2 py-0.5 text-[9px] font-semibold tracking-wider">
          PROTOTYPE
        </span>
      </Link>
      <div className="flex items-center gap-3">
        <Button asChild className="gap-2" size="sm" variant="ghost">
          <Link href="/docs/shadcn">
            <BookOpen className="size-4" />
            UI Library
          </Link>
        </Button>
        <span className="bg-border h-8 w-px" />
        <Button asChild className="gap-2" size="sm" variant="outline">
          <Link href="/docs/scopify">
            <PanelsTopLeft className="size-4" />
            Scopify UI
          </Link>
        </Button>
        <Button asChild className="size-8" size="icon" variant="ghost">
          <a href="https://github.com/MT-SUPER-POWER/Scopify" aria-label="GitHub">
            <GitFork className="size-4" />
          </a>
        </Button>
      </div>
    </header>
  );
}
