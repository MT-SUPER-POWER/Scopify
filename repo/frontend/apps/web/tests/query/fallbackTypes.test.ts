import { expect, it } from "bun:test";
import { resolve } from "node:path";
import ts from "typescript";

it("preserves TanStack error and data inference through the boundary policy", () => {
  const root = resolve(import.meta.dir, "../..");
  const fixturePath = resolve(root, "tests/query/fallback-types.fixture.ts");
  const fixture = `
    import { useQuery } from "@tanstack/react-query";
    import { throwQueryErrorWithoutData } from "@/lib/query/errorPolicy";
    import { selectFallbackSource, toFallbackSource } from "@/lib/query/fallbackSource";
    type Row = { id: number; musicSize?: number };
    export function useContract(boundary: boolean) {
      const followed = useQuery({
        queryKey: ["followed"], queryFn: async () => [{ id: 1 }],
        throwOnError: boundary ? throwQueryErrorWithoutData : false,
      });
      const hot = useQuery({
        queryKey: ["hot"], queryFn: async () => [{ id: 2, musicSize: 10 }],
        throwOnError: throwQueryErrorWithoutData,
      });
      const error: Error | null = hot.error;
      const selected = selectFallbackSource<Row[]>([
        toFallbackSource(followed, followed.data), toFallbackSource(hot, hot.data),
      ], rows => rows.length > 0);
      return { error, selected };
    }
  `;
  const options: ts.CompilerOptions = {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    types: [],
    target: ts.ScriptTarget.ES2017,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    esModuleInterop: true,
    paths: { "@/*": [resolve(root, "*")] },
  };
  const host = ts.createCompilerHost(options);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, ...args) =>
    resolve(fileName) === fixturePath
      ? ts.createSourceFile(fileName, fixture, options.target ?? ts.ScriptTarget.ES2017, true)
      : getSourceFile(fileName, ...args);
  const program = ts.createProgram([fixturePath], options, host);
  const errors = ts
    .getPreEmitDiagnostics(program)
    .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
  expect(errors).toEqual([]);
});
