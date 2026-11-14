import { GitHubProvider } from "electron-updater/out/providers/GitHubProvider";
import { parseUpdateInfo } from "electron-updater/out/providers/Provider";

import { repository } from "../../../../package.json";

const HOST = "https://github.com";
const REPOSITORY_SLUG = /^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9_.-]+$/;
const PAGE_SIZE = 100;
const VERSION_TAG = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-beta\.(0|[1-9]\d*))?$/;

export function getUpdateRepository(override = process.env.SCOPIFY_UPDATE_REPOSITORY) {
  const slug = override?.trim() || new URL(repository.url).pathname.slice(1).replace(/\.git$/, "");
  const [, repo] = slug.split("/");
  if (!REPOSITORY_SLUG.test(slug) || repo === "." || repo === "..") {
    throw new Error("SCOPIFY_UPDATE_REPOSITORY must use the GitHub owner/repo format");
  }
  return slug;
}

export function getReleaseBaseUrl(slug = getUpdateRepository()) {
  return `${HOST}/${slug}/releases`;
}

type ProviderArgs = ConstructorParameters<typeof GitHubProvider>;

export function selectUpdateRelease(
  releases: readonly unknown[],
  allowPrerelease: boolean,
  channelFile: string,
): { tag: string; version: string } | undefined {
  let best: { tag: string; version: string } | undefined;
  let bestRank: readonly number[] | undefined;
  for (const release of releases) {
    if (!release || typeof release !== "object") continue;
    const { tag_name: tag, draft, prerelease, assets } = release as Record<string, unknown>;
    if (draft !== false || typeof tag !== "string" || typeof prerelease !== "boolean") continue;
    const parts = VERSION_TAG.exec(tag);
    if (!parts || Boolean(parts[4]) !== prerelease || (prerelease && !allowPrerelease)) continue;
    if (!Array.isArray(assets) || !assets.some((asset) => asset?.name === channelFile)) continue;

    const rank = [
      Number(parts[1]),
      Number(parts[2]),
      Number(parts[3]),
      parts[4] === undefined ? 1 : 0,
      Number(parts[4] ?? 0),
    ];
    if (!rank.every(Number.isSafeInteger)) continue;
    const previous = bestRank;
    if (previous) {
      const difference = rank.findIndex((value, i) => value !== previous[i]);
      if (difference === -1 || rank[difference] < previous[difference]) continue;
    }
    best = { tag, version: tag.slice(1) };
    bestRank = rank;
  }
  return best;
}

/** Select by version first, then use the GitHub provider's normal installer and blockmap handling. */
export class ReleaseProvider extends GitHubProvider {
  private readonly slug: string;

  constructor(
    _options: unknown,
    private readonly updateApp: ProviderArgs[1],
    runtimeOptions: ProviderArgs[2],
  ) {
    const slug = getUpdateRepository();
    const [owner, repo] = slug.split("/");
    super({ provider: "github", owner, repo }, updateApp, runtimeOptions);
    this.slug = slug;
  }

  override async getLatestVersion() {
    const allowPrerelease = this.updateApp.allowPrerelease;
    const channelFile = `${this.getDefaultChannelName()}.yml`;
    const releases: unknown[] = [];
    for (let page = 1; ; page++) {
      const url = new URL(
        `https://api.github.com/repos/${this.slug}/releases?per_page=${PAGE_SIZE}&page=${page}`,
      );
      const raw = await this.httpRequest(url, { Accept: "application/vnd.github+json" });
      const batch: unknown = JSON.parse(raw ?? "null");
      if (!Array.isArray(batch)) throw new Error("Invalid GitHub releases response");
      releases.push(...batch);
      if (batch.length < PAGE_SIZE) break;
    }
    const release = selectUpdateRelease(releases, allowPrerelease, channelFile);
    if (!release) throw new Error(`No published release in ${this.slug} with ${channelFile}`);
    const metadataUrl = new URL(
      `${getReleaseBaseUrl(this.slug)}/download/${release.tag}/${channelFile}`,
    );
    const update = parseUpdateInfo(await this.httpRequest(metadataUrl), channelFile, metadataUrl);
    if (update.version !== release.version)
      throw new Error("Update metadata does not match its release tag");
    return { ...update, tag: release.tag };
  }
}
