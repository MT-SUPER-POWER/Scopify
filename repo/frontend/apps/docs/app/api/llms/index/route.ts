import { llms } from "fumadocs-core/source";

import { source } from "@/lib/source";

export const revalidate = false;

export function GET() {
  const index = llms(source, {
    renderName: (node, ctx) => {
      if (node.type === "page") {
        const page = source.getNodePage(node, ctx.lang);
        if (page?.data.title) return page.data.title;
      } else if (node.type !== "separator") {
        const meta = source.getNodeMeta(node, ctx.lang);
        if (meta?.data.title) return meta.data.title;
      }
      return typeof node.name === "string" ? node.name : "Scopify Docs";
    },
    renderDescription: (node, ctx) => {
      if (node.type === "page") {
        const page = source.getNodePage(node, ctx.lang);
        if (page?.data.description) return page.data.description;
      } else {
        const meta = source.getNodeMeta(node, ctx.lang);
        if (meta?.data.description) return meta.data.description;
      }
      return "";
    },
  }).index();

  return new Response(index, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
