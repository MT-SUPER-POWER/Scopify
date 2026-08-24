const path = require("node:path");
const Module = require("node:module");

function shouldCheckVersion(backendRoot, resourcesPath = process.resourcesPath) {
  if (!resourcesPath) return true;
  return path.resolve(backendRoot) !== path.resolve(resourcesPath, "backend");
}

async function start() {
  const backendRoot = process.cwd();
  process.env.NODE_PATH = path.join(backendRoot, "vendor");
  Module.Module._initPaths();
  const generateConfig = require(path.join(backendRoot, "generateConfig"));
  const { serveNcmApi } = require(path.join(backendRoot, "server"));
  const configuredPort = Number.parseInt(process.env.PORT || "", 10);
  const port = Number.isFinite(configuredPort) && configuredPort > 0 ? configuredPort : 3838;
  const host = process.env.HOST || "127.0.0.1";

  await generateConfig();
  await serveNcmApi({
    // The packaged desktop app already owns update checks. Do not make local
    // backend availability depend on an npm registry request during startup.
    checkVersion: shouldCheckVersion(backendRoot),
    host,
    port,
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { shouldCheckVersion };
