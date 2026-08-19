import { source } from "@/lib/source";

export async function getLLMText(page: (typeof source)["$inferPage"]) {
  const data = page.data as typeof page.data & {
    _markdown?: string;
    getText?: (type: string) => Promise<string> | string;
  };

  let content = "";
  if (typeof data.getText === "function") {
    content = await data.getText("processed");
  } else if (typeof data._markdown === "string") {
    content = data._markdown;
  } else {
    content = page.data.description ?? "";
  }

  return `# ${page.data.title} (${page.url})\n\n${content}`.trim();
}
