import type { ProviderRouteRequirement } from "@/types/music/providerComponents";

/**
 * Dashboard routes and the capability each needs. A route opened directly on a platform without
 * it shows the "not supported on this platform" state instead of sending requests. Longer
 * prefixes are listed before the shorter ones they extend.
 */
export const PROVIDER_ROUTE_REQUIREMENTS: readonly ProviderRouteRequirement[] = [
  { prefix: "/", requires: "recommend.daily", exact: true },
  { prefix: "/recent/report", requires: "history" },
  { prefix: "/recent", requires: "history" },
  { prefix: "/liked", requires: "library.playlists" },
  { prefix: "/collection", requires: "library.playlists" },
  { prefix: "/podcasts", requires: "podcast" },
  { prefix: "/radio", requires: "podcast" },
  { prefix: "/cloud", requires: "cloud" },
  { prefix: "/social", requires: "social" },
  { prefix: "/profile", requires: "social" },
  { prefix: "/personal-fm", requires: "recommend.fm" },
  { prefix: "/playlist", requires: "playlist.read" },
  { prefix: "/album", requires: "album.read" },
  { prefix: "/artist", requires: "artist.read" },
  { prefix: "/mv", requires: "mv" },
  { prefix: "/comment", requires: "comments.read" },
  { prefix: "/search", requires: "search" },
  { prefix: "/setting/devices", requires: "devices" },
];
