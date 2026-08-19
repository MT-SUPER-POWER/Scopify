import { loader } from "fumadocs-core/source";
import { defineDocs } from "fumadocs-mdx/macro";

import { resolveDocumentDomainIcon } from "@/components/docs/document-domain-icon";

const docs = defineDocs({
  dir: "content/docs",
  docs: {
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
});

export const source = loader({
  baseUrl: "/docs",
  icon: resolveDocumentDomainIcon,
  source: docs.toFumadocsSource(),
});
