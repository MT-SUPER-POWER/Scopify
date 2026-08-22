import { BookOpen, Braces, Library } from "lucide-react";

const DOCUMENT_DOMAIN_ICONS = {
  framework: BookOpen,
  openapi: Braces,
  uiLibrary: Library,
} as const;

export function resolveDocumentDomainIcon(name: string | undefined) {
  if (!name || !(name in DOCUMENT_DOMAIN_ICONS)) {
    return undefined;
  }

  const Icon = DOCUMENT_DOMAIN_ICONS[name as keyof typeof DOCUMENT_DOMAIN_ICONS];

  return <Icon aria-hidden="true" />;
}
