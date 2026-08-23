import { ShadcnExample } from "@/components/docs/shadcn-example";
import { formatCodeSnippet } from "@/lib/format-code-snippet";
import type { ShadcnExampleProps } from "@/types/component-docs";

export async function ShadcnMdxExample(props: ShadcnExampleProps) {
  const code = await formatCodeSnippet(props.code, props.lang ?? "tsx");

  return <ShadcnExample {...props} code={code} />;
}
