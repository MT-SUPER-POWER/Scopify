import { readFileSync, existsSync } from "fs";
import { join } from "path";
import yaml from "js-yaml";
import { spawn } from "child_process";

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
