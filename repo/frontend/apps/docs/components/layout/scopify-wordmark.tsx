import Image from "next/image";
import wordmarkOnDark from "@/assets/wordmark-on-dark.png";
import wordmarkOnLight from "@/assets/wordmark-on-light.png";
import type { ScopifyWordmarkProps } from "@/types/brand";

export function ScopifyWordmark({ className = "w-28", tone = "auto" }: ScopifyWordmarkProps) {
  return (
    <span aria-hidden="true" className={"inline-grid shrink-0 items-center " + className}>
      {tone !== "on-dark" && (
        <Image
          src={wordmarkOnLight}
          alt=""
          className={"col-start-1 row-start-1 h-auto w-full" + (tone === "auto" ? " dark:hidden" : "")}
        />
      )}
      {tone !== "on-light" && (
        <Image
          src={wordmarkOnDark}
          alt=""
          className={"col-start-1 row-start-1 h-auto w-full" + (tone === "auto" ? " hidden dark:block" : "")}
        />
      )}
    </span>
  );
}
