import { expect, test } from "bun:test";
import {
  ReleaseProvider,
  selectUpdateRelease,
} from "../electron/main/service/updates/releaseProvider";

const channelFile = "latest.yml";
const release = (tag: string) => ({
  tag_name: tag,
  draft: false,
  prerelease: tag.includes("-"),
  assets: [{ name: channelFile }],
});

test("a newer stable version wins even when the Beta was published later", () => {
  expect(
    selectUpdateRelease([release("v4.0.1-beta.10"), release("v4.0.1")], true, channelFile),
  ).toEqual({ tag: "v4.0.1", version: "4.0.1" });
});

test("the highest Beta wins by numeric version when the user opted in", () => {
  const releases = [
    release("v3.4.5"),
    release("v4.0.1-beta.9"),
    release("v4.0.1-beta.10"),
    release("v4.0.0-beta.99"),
  ];
  expect(selectUpdateRelease(releases, true, channelFile)?.version).toBe("4.0.1-beta.10");
  expect(selectUpdateRelease(releases, false, channelFile)?.version).toBe("3.4.5");
});

test("drafts, other prerelease channels and releases without platform metadata are ineligible", () => {
  const releases = [
    { ...release("v9.0.0"), draft: true },
    release("v8.0.0-rc.1"),
    { ...release("v7.0.0"), assets: [{ name: "latest-mac.yml" }] },
    release("v4.0.0"),
  ];
  expect(selectUpdateRelease(releases, true, channelFile)?.version).toBe("4.0.0");
});

test("finds older releases on later pages and resolves assets from the winning tag", async () => {
  const requests: string[] = [];
  class TestProvider extends ReleaseProvider {
    protected override async httpRequest(url: URL): Promise<string> {
      requests.push(url.pathname + url.search);
      if (url.searchParams.get("page") === "1") {
        return JSON.stringify(Array.from({ length: 100 }, () => release("v4.0.0-beta.2")));
      }
      if (url.searchParams.get("page") === "2") return JSON.stringify([release("v4.0.1")]);
      return "version: 4.0.1\nfiles:\n  - url: Scopify.exe\n    sha512: test\n";
    }
  }
  const provider = new TestProvider(
    {},
    { allowPrerelease: true } as ConstructorParameters<typeof ReleaseProvider>[1],
    { platform: "win32" } as ConstructorParameters<typeof ReleaseProvider>[2],
  );
  const info = await provider.getLatestVersion();
  expect(info.version).toBe("4.0.1");
  expect(requests.at(-1)).toContain("/releases/download/v4.0.1/latest.yml");
  expect(provider.resolveFiles(info)[0].url.pathname).toContain(
    "/releases/download/v4.0.1/Scopify.exe",
  );
});
