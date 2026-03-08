#!/usr/bin/env node

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

// 颜色代码
const colors = {
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
};

/**
 * 为输出添加前缀
 */
function prefixOutput(prefix: string, color: string) {
  return (data: Buffer) => {
    const lines = data.toString().split("\n");
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(
          `${color}[${prefix}]${colors.reset} ${line}`
        );
      }
    });
  };
}

/**
 * 启动开发服务器
 * 并行运行 Next.js 和 Electron
 */
async function startDev() {
  console.log("🚀 Starting development Env ...\n");

  // 启动 Next.js
  const nextProcess = spawn("next", ["dev"], {
    cwd: projectRoot,
    stdio: ["inherit", "pipe", "pipe"],
  });

  nextProcess.stdout?.on("data", prefixOutput("NEXT", colors.yellow));
  nextProcess.stderr?.on("data", prefixOutput("NEXT", colors.yellow));

  // 给 Next.js 一点时间启动
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // 启动 Electron
  const electronProcess = spawn("electron", ["."], {
    cwd: projectRoot,
    stdio: ["inherit", "pipe", "pipe"],
  });

  electronProcess.stdout?.on("data", prefixOutput("ELECTRON", colors.blue));
  electronProcess.stderr?.on("data", prefixOutput("ELECTRON", colors.blue));

  // 处理进程终止
  process.on("SIGINT", () => {
    console.log("\n📛 Shutting down...");
    nextProcess.kill();
    electronProcess.kill();
    process.exit(0);
  });

  // 监听进程退出
  nextProcess.on("exit", () => {
    electronProcess.kill();
    process.exit(0);
  });

  electronProcess.on("exit", () => {
    nextProcess.kill();
    process.exit(0);
  });
}

startDev().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
