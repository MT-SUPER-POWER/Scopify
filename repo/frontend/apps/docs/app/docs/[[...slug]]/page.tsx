import type { Metadata } from "next";
import type { ComponentProps } from "react";
import type { MDXContent } from "mdx/types";
import { notFound } from "next/navigation";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";

import { getMDXComponents } from "@/components/mdx";
import { source } from "@/lib/source";

interface DocsRouteProps {
  params: Promise<{ slug?: string[] }>;
}

interface CompiledDocsData {
  body: MDXContent;
  full?: boolean;
  toc: NonNullable<ComponentProps<typeof DocsPage>["toc"]>;
}

export default async function DocsRoute({ params }: DocsRouteProps) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  const data = page.data as typeof page.data & CompiledDocsData;
  const Content = data.body;
  const components = getMDXComponents();

  return (
    <DocsPage toc={data.toc} full={data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <Content components={components} />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({ params }: DocsRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  return { title: page.data.title, description: page.data.description };
}
