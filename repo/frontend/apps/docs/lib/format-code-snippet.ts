import { format } from "prettier";

const PARSER_BY_LANGUAGE = {
  css: "css",
  js: "babel",
  javascript: "babel",
  jsx: "babel",
  json: "json",
  ts: "typescript",
  tsx: "typescript",
  typescript: "typescript",
} as const;

export async function formatCodeSnippet(code: string, language: string): Promise<string> {
  const parser = PARSER_BY_LANGUAGE[language as keyof typeof PARSER_BY_LANGUAGE];
  if (!parser) return code.trim();

  try {
    const formatted = (
      await format(code, {
        parser,
        printWidth: 100,
        tabWidth: 2,
      })
    ).trim();

    return code.trimEnd().endsWith(">") && formatted.endsWith(">;")
      ? formatted.slice(0, -1)
      : formatted;
  } catch {
    return code.trim();
  }
}
