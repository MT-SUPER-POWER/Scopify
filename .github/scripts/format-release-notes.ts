import { existsSync, readFileSync, writeFileSync } from "node:fs";

export function generateDownloadHeader(tag: string, repo = "MT-SUPER-POWER/Scopify"): string {
  const downloadBase = `https://github.com/${repo}/releases/download/${tag}`;
  const appleIcon = "https://cdn-icons-png.flaticon.com/512/179/179309.png";
  const windowsIcon = "https://cdn-icons-png.flaticon.com/512/732/732225.png";

  return `### 客户端快速下载 / Quick Downloads

| 平台 | 架构 | 安装包下载 | 说明 |
| :--- | :--- | :--- | :--- |
| <img src="${appleIcon}" width="16" height="16" alt="macOS" /> **macOS** | Apple Silicon (\`arm64\`) | [**下载 .dmg**](${downloadBase}/Scopify.Setup.${tag}.darwin.arm64.dmg) · [.zip](${downloadBase}/Scopify.Setup.${tag}.darwin.arm64.zip) | Apple Silicon Mac（推荐） |
| <img src="${appleIcon}" width="16" height="16" alt="macOS" /> **macOS** | Intel (\`x64\`) | [**下载 .dmg**](${downloadBase}/Scopify.Setup.${tag}.darwin.x64.dmg) · [.zip](${downloadBase}/Scopify.Setup.${tag}.darwin.x64.zip) | Intel 处理器 Mac |
| <img src="${windowsIcon}" width="16" height="16" alt="Windows" /> **Windows** | 64 位 (\`x64\`) | [**下载 .exe 安装包**](${downloadBase}/Scopify.Setup.${tag}.win32.x64.exe) | Intel / AMD 处理器（绝大多数用户推荐） |
| <img src="${windowsIcon}" width="16" height="16" alt="Windows" /> **Windows** | ARM64 | [**下载 .exe 安装包**](${downloadBase}/Scopify.Setup.${tag}.win32.arm64.exe) | ARM 架构 Windows 设备 |

> [!TIP]
> **macOS 首次安装提示“对系统有害”或“已损坏”的处理方法：**
> 1. 打开下载的 DMG 镜像，**务必先将 \`Scopify.app\` 拖入右侧的「应用程序」（Applications）目录**（切勿直接在只读 DMG 中双击运行）；
> 2. 打开 Mac 自带的「终端」（Terminal），粘贴并运行以下命令解除隔离：
>    \`\`\`bash
>    sudo xattr -rd com.apple.quarantine /Applications/Scopify.app
>    \`\`\`
>    输入开机密码回车（输入时不显示字符）即可正常启动。
> *(备选：也可在「系统设置」→「隐私与安全性」→「安全性」中点击“仍要打开”)*

---

`;
}

export function formatReleaseNotes(tag: string, notes: string): string {
  if (notes.includes("快速下载") || notes.includes("Quick Downloads")) {
    const stripped = notes.replace(/^### .*?---\s*\n\s*/s, "");
    return `${generateDownloadHeader(tag)}${stripped.trimStart()}`;
  }
  return `${generateDownloadHeader(tag)}${notes.trimStart()}`;
}

if (import.meta.main) {
  const tag = process.argv[2] || process.env.GITHUB_REF_NAME || "";
  const filePath = process.argv[3] || "release_notes.md";

  if (!tag) {
    console.error("Usage: bun format-release-notes.ts <tag> [filePath]");
    process.exit(1);
  }

  const existingNotes = existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
  const formatted = formatReleaseNotes(tag, existingNotes);
  writeFileSync(filePath, formatted, "utf8");
  console.log(`Formatted release notes for ${tag} in ${filePath}`);
}
