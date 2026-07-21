import { expect, test, type APIRequestContext } from "@playwright/test";

const backendBaseUrl = "http://127.0.0.1:3839";
const albumTitle = "E2E Test Album";
const trackTitle = "E2E Test Track";

async function setAlbumMode(
  albumId: string,
  mode: "delayed" | "fail" | "success",
  request: APIRequestContext,
) {
  const response = await request.post(`${backendBaseUrl}/__test__/album-mode`, {
    data: { albumId, mode },
  });
  await expect(response).toBeOK();
}

test.describe("album page", () => {
  test("does not persist a cancelled pending album query", async ({ page, request }) => {
    const albumId = "1003";
    const hydrationErrors: string[] = [];
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        message.text().includes("A query that was dehydrated as pending ended up rejecting")
      ) {
        hydrationErrors.push(message.text());
      }
    });

    await setAlbumMode(albumId, "delayed", request);
    const albumRequest = page.waitForRequest(
      (request) =>
        request.url().startsWith(`${backendBaseUrl}/album`) &&
        new URL(request.url()).searchParams.get("id") === albumId,
    );

    await page.goto(`/album?id=${albumId}`);
    await albumRequest;
    await page.goto("/");
    await page.reload();

    expect(hydrationErrors, hydrationErrors.join("\n")).toEqual([]);
  });

  test("renders the queried album and its track", async ({ page }, testInfo) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto("/album?id=1001");

    await expect(page.getByRole("heading", { name: albumTitle })).toBeVisible();
    await expect(page.getByText(trackTitle, { exact: true })).toBeVisible();
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath("album-loaded.png"),
    });

    expect(pageErrors).toEqual([]);
  });

  test("shows a page-level error and recovers after retry", async ({ page, request }, testInfo) => {
    const albumId = String(1002 + testInfo.repeatEachIndex);
    await setAlbumMode(albumId, "fail", request);
    await page.goto(`/album?id=${albumId}`);

    await expect(page.getByText("当前网络异常", { exact: true })).toBeVisible();
    await setAlbumMode(albumId, "success", request);
    await page.getByRole("button", { name: "刷新", exact: true }).click();

    await expect(page.getByRole("heading", { name: albumTitle })).toBeVisible();
  });
});
