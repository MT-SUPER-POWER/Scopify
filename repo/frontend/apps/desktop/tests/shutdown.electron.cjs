const assert = require("node:assert/strict");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { pathToFileURL } = require("node:url");
const { app, BrowserWindow, Menu } = require("electron");

// The runner supplies a temporary profile and transpiled shutdown module.
async function run() {
  const root = process.env.SCOPIFY_SHUTDOWN_SMOKE_ROOT;
  assert.ok(root, "SCOPIFY_SHUTDOWN_SMOKE_ROOT is required");
  const { createApplicationShutdown } = await import(pathToFileURL(join(root, "shutdown.mjs")));
  const deadline = process.env.SCOPIFY_SHUTDOWN_SMOKE_MODE === "deadline";
  app.name = "Scopify Quit Smoke Test";
  app.setPath("userData", join(root, "profile"));
  await app.whenReady();
  const server = createServer((_request, response) => response.end("ok"));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  let cleaned = false;
  let closeAttempts = 0;
  const shutdown = createApplicationShutdown({
    dispose: async () => {
      if (deadline) await new Promise(() => {});
      await new Promise((resolve) => server.close(resolve));
      cleaned = true;
      console.log("[quit-smoke] service listener closed");
    },
    exit: () => {
      assert.equal(cleaned, !deadline);
      assert.equal(closeAttempts, 0, "final exit must bypass window close interception");
      console.log(
        `[quit-smoke] PASS: ${deadline ? "deadline" : "Cmd+Q"} exits despite window close veto`,
      );
      app.exit(0);
    },
    onError: (error) => console.log("[quit-smoke]", error.message),
    onStarted: () => console.log("[quit-smoke] before-quit received"),
    timeoutMs: 300,
  });
  app.on("before-quit", (event) => void shutdown.handleBeforeQuit(event));
  Menu.setApplicationMenu(Menu.buildFromTemplate([{ role: "appMenu" }]));
  const window = new BrowserWindow({ width: 540, height: 220, title: "Scopify Quit Smoke Test" });
  window.on("close", (event) => {
    closeAttempts += 1;
    event.preventDefault();
  });
  await window.loadURL(
    "data:text/html,<title>Scopify Quit Smoke Test</title><h2>Scopify Quit Smoke Test</h2><p>This isolated window deliberately refuses to close.</p><p>Press Command+Q to test application exit.</p>",
  );
  console.log("[quit-smoke] READY: press Cmd+Q in the isolated test window");
  if (deadline) app.quit();
  setTimeout(() => app.exit(9), 180_000).unref();
}

run().catch((error) => {
  console.error(error);
  app.exit(1);
});
