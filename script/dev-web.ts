import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";

const configPath = join(process.cwd(), "config", "app.config.yml");
const defaultPath = join(process.cwd(), "config", "app.config.default.yml");

function loadConfig() {
  try {
    const raw = readFileSync(existsSync(configPath) ? configPath : defaultPath, "utf-8");
    return yaml.load(raw) as any;
  } catch (e) {
    console.error("Failed to load config, using default port 3232", e);
    return { frontend: { devPort: 3232 } };
  }
}

const config = loadConfig();
const port = config.frontend?.devPort || 3232;

console.log(`Starting Next.js on port ${port}...`);

const nextDev = spawn("bunx", ["next", "dev", "-p", port.toString()], {
  stdio: "inherit",
  shell: true,
});

nextDev.on("close", (code) => {
  process.exit(code || 0);
});
