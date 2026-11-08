import type { MusicCapability } from "@scopify/music-domain/capability";

import { PROVIDER_ROUTE_REQUIREMENTS } from "@/constants/providerRoutes";

/** The capability a pathname needs, or null for routes every platform can show. */
export function routeCapability(pathname: string): MusicCapability | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  for (const route of PROVIDER_ROUTE_REQUIREMENTS) {
    if (path === route.prefix) return route.requires;
    if (!route.exact && path.startsWith(`${route.prefix}/`)) return route.requires;
  }
  return null;
}

/** The capability a link target (path plus optional query) needs. */
export function hrefCapability(href: string): MusicCapability | null {
  return routeCapability(href.split(/[?#]/, 1)[0] || "/");
}
