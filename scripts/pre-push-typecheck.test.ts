import { describe, expect, it } from "bun:test";
import { collectPushedFiles, selectTypecheckPackages } from "./pre-push-typecheck";

describe("pre-push-typecheck script", () => {
  it("forces full typecheck (null) when pushing a git tag", () => {
    const input =
      "refs/tags/v3.4.0 ba11af913eabb1564909e2af5d00c85c8c679508 refs/tags/v3.4.0 0000000000000000000000000000000000000000\n";
    expect(collectPushedFiles(input)).toBeNull();
  });

  it("skips tag deletions without triggering full typecheck", () => {
    const input =
      "refs/tags/v3.4.0 0000000000000000000000000000000000000000 refs/tags/v3.4.0 ba11af913eabb1564909e2af5d00c85c8c679508\n";
    const files = collectPushedFiles(input);
    expect(files).not.toBeNull();
    expect(files?.size).toBe(0);
  });

  it("returns empty set on empty stdin", () => {
    const files = collectPushedFiles("");
    expect(files).not.toBeNull();
    expect(files?.size).toBe(0);
  });

  it("triggers full check (null) when global inputs are modified", () => {
    const pkgs = selectTypecheckPackages(["package.json"]);
    expect(pkgs).toBeNull();

    const pkgsLock = selectTypecheckPackages(["pnpm-lock.yaml"]);
    expect(pkgsLock).toBeNull();

    const pkgsTsconfig = selectTypecheckPackages(["tsconfig.json"]);
    expect(pkgsTsconfig).toBeNull();
  });

  it("identifies target packages when workspace source files change", () => {
    const pkgs = selectTypecheckPackages([
      "repo/frontend/apps/web/components/Button.tsx",
      "repo/frontend/apps/desktop/electron/main/index.ts",
    ]);
    expect(pkgs).not.toBeNull();
    expect(pkgs?.has("@scopify/web")).toBe(true);
    expect(pkgs?.has("@scopify/desktop")).toBe(true);
  });

  it("adds docs when web changes, since docs compiles web source", () => {
    const pkgs = selectTypecheckPackages(["repo/frontend/apps/web/hooks/lyrics/useSongChorus.ts"]);
    expect(pkgs?.has("@scopify/docs")).toBe(true);
  });

  it("ignores non-typecheckable files", () => {
    const pkgs = selectTypecheckPackages([
      "repo/frontend/apps/web/README.md",
      "repo/frontend/apps/web/style.css",
      "repo/frontend/apps/desktop/assets/icon.png",
    ]);
    expect(pkgs).not.toBeNull();
    expect(pkgs?.size).toBe(0);
  });
});
