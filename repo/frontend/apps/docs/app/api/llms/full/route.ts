import { getLLMText } from "@/lib/get-llm-text";
import { source } from "@/lib/source";

export const revalidate = false;

export async function GET() {
  const pages = source.getPages();
  const scan = pages.map(getLLMText);
  const scanned = await Promise.all(scan);

  return new Response(scanned.join("\n\n---\n\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
