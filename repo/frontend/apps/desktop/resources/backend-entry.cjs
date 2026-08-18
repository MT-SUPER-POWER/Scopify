const path = require("node:path");
const Module = require("node:module");

const backendRoot = process.cwd();
process.env.NODE_PATH = path.join(backendRoot, "vendor");
Module.Module._initPaths();
const generateConfig = require(path.join(backendRoot, "generateConfig"));
const { serveNcmApi } = require(path.join(backendRoot, "server"));

const configuredPort = Number.parseInt(process.env.PORT || "", 10);
const port = Number.isFinite(configuredPort) && configuredPort > 0 ? configuredPort : 3838;
const host = process.env.HOST || "127.0.0.1";

async function start() {
  await generateConfig();
  await serveNcmApi({
    checkVersion: true,
    host,
    port,
  });
}

start().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
