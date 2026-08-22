import type { ComponentProps, ReactNode } from "react";
import { Tabs as FumaTabs, TabsContent, TabsList, TabsTrigger } from "fumadocs-ui/components/tabs";

export function CodeTabs({ children, ...props }: ComponentProps<typeof FumaTabs>) {
  return (
    <FumaTabs defaultValue="cli" className="relative mt-6 w-full" {...props}>
      {children}
    </FumaTabs>
  );
}

export { TabsContent, TabsList, TabsTrigger };

export function Steps({ children, className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={`[&>h3]:before:bg-background my-8 ml-4 border-l pl-8 [counter-reset:step] [&>h3]:relative [&>h3]:mb-3 [&>h3]:font-semibold [&>h3]:[counter-increment:step] [&>h3]:before:absolute [&>h3]:before:-left-[3.25rem] [&>h3]:before:flex [&>h3]:before:size-8 [&>h3]:before:items-center [&>h3]:before:justify-center [&>h3]:before:rounded-full [&>h3]:before:border [&>h3]:before:text-sm [&>h3]:before:content-[counter(step)] ${className ?? ""}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function Step({ children, ...props }: { children?: ReactNode } & ComponentProps<"h3">) {
  return <h3 {...props}>{children}</h3>;
}
