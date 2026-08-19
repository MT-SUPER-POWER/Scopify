import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, posix, relative, resolve } from "node:path";

import type { LegacyEndpointDoc, NeteaseApiTag } from "@/types/netease-api-docs";

const SPECIAL_ROUTES: Record<string, string> = {
  "daily_signin.js": "/daily_signin",
  "fm_trash.js": "/fm_trash",
  "personal_fm.js": "/personal_fm",
};

export const NETEASE_API_TAGS: NeteaseApiTag[] = [
  {
    name: "auth",
    title: "登录与会话",
    description: "登录、验证码、二维码与会话状态。",
    prefixes: ["/login", "/logout", "/captcha", "/register", "/activate"],
  },
  {
    name: "users",
    title: "用户与账号",
    description: "用户资料、关注关系、等级与账号信息。",
    prefixes: ["/user", "/account", "/nickname", "/avatar", "/follow", "/event"],
  },
  {
    name: "search",
    title: "搜索与发现",
    description: "搜索、热搜、建议与首页发现入口。",
    prefixes: ["/search", "/cloudsearch", "/homepage", "/banner", "/related"],
  },
  {
    name: "songs",
    title: "歌曲与歌词",
    description: "歌曲详情、歌词、识曲与曲目元数据。",
    prefixes: ["/song", "/lyric", "/simi/song", "/audio", "/scrobble"],
  },
  {
    name: "playlists",
    title: "歌单",
    description: "歌单详情、曲目、收藏、创建与管理。",
    prefixes: ["/playlist", "/top/playlist", "/related/playlist"],
  },
  {
    name: "artists",
    title: "歌手",
    description: "歌手资料、作品、动态与关注。",
    prefixes: ["/artist", "/artists", "/simi/artist"],
  },
  {
    name: "albums",
    title: "专辑",
    description: "专辑详情、歌曲、收藏与数字专辑。",
    prefixes: ["/album", "/digitalAlbum"],
  },
  {
    name: "comments",
    title: "评论",
    description: "歌曲、歌单、专辑、视频与播客评论。",
    prefixes: ["/comment", "/resource/comments"],
  },
  {
    name: "radio",
    title: "播客与电台",
    description: "播客声音、电台、节目与主播内容。",
    prefixes: ["/dj", "/voice", "/voicelist", "/broadcast"],
  },
  {
    name: "video",
    title: "视频与 MV",
    description: "视频、MV、短视频与相关资源。",
    prefixes: ["/video", "/mv", "/mlog"],
  },
  {
    name: "recommendations",
    title: "推荐",
    description: "个性化推荐、每日推荐与私人 FM。",
    prefixes: ["/recommend", "/personalized", "/personal_fm", "/history/recommend"],
  },
  {
    name: "playback",
    title: "播放与音质",
    description: "播放地址、音质、缓存与播放行为。",
    prefixes: ["/song/url", "/song/download/url", "/song/music/detail", "/check/music"],
  },
  {
    name: "cloud",
    title: "云盘",
    description: "网易云音乐云盘、上传与资源管理。",
    prefixes: ["/cloud", "/user/cloud"],
  },
  {
    name: "system",
    title: "系统与工具",
    description: "服务状态、版本、解密与辅助能力。",
    prefixes: ["/status", "/inner/version", "/eapi", "/weapi", "/weblog", "/device"],
  },
  { name: "other", title: "其他接口", description: "尚未归入稳定资源域的增强接口。", prefixes: [] },
];

function cleanText(value: string) {
  return value
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[`*_~>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractParameterBlock(section: string, label: "必选参数" | "可选参数") {
  return (
    section.match(
      new RegExp(`\\*\\*${label}\\s*:\\*\\*\\s*([\\s\\S]*?)(?=\\n\\*\\*|\\n###|$)`),
    )?.[1] ?? ""
  );
}

function parseLegacyDocs(markdown: string) {
  const docs = new Map<string, LegacyEndpointDoc>();
  const sections = markdown.split(/\n(?=###\s+)/);

  for (const section of sections) {
    const title = section.match(/^###\s+(.+)$/m)?.[1]?.trim();
    const addressLine = section.match(/\*\*接口地址\s*:\*\*\s*([^\n]+)/)?.[1];
    if (!title || !addressLine) continue;

    const routes = [...addressLine.matchAll(/\/[A-Za-z0-9_()/-]+/g)].map(([route]) => route);
    if (routes.length === 0) continue;

    const description = section.match(/说明\s*:\s*([\s\S]*?)(?=\n\*\*|\n###|\n```|$)/)?.[1];
    const requiredBlock = extractParameterBlock(section, "必选参数");
    const optionalBlock = extractParameterBlock(section, "可选参数");
    const required = new Set(
      [...requiredBlock.matchAll(/`([A-Za-z_$][\w$]*)`/g)].map((match) => match[1]),
    );
    const optional = new Set(
      [...optionalBlock.matchAll(/`([A-Za-z_$][\w$]*)`/g)].map((match) => match[1]),
    );
    const parameterDescriptions = new Map<string, string>();

    for (const block of [requiredBlock, optionalBlock]) {
      for (const match of block.matchAll(/`([A-Za-z_$][\w$]*)`\s*[:：]\s*([^\n]+)/g)) {
        parameterDescriptions.set(match[1], cleanText(match[2]));
      }
    }

    const examples = new Map<string, string>();
    const exampleBlock = section.match(/\*\*调用例子\s*:\*\*\s*([^\n]+)/)?.[1] ?? "";
    for (const match of exampleBlock.matchAll(/\/[^`\s,]+/g)) {
      try {
        const url = new URL(match[0], "https://example.com");
        for (const [name, value] of url.searchParams) examples.set(name, value);
      } catch {
        // Ignore malformed examples from the historical markdown.
      }
    }

    const endpoint: LegacyEndpointDoc = {
      title: cleanText(title),
      description: description ? cleanText(description) : undefined,
      required,
      optional,
      parameterDescriptions,
      examples,
    };

    for (const route of routes) docs.set(route, endpoint);
  }

  return docs;
}

async function collectModuleFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) return collectModuleFiles(path);
      return entry.isFile() && entry.name.endsWith(".js") ? [path] : [];
    }),
  );
  return files.flat();
}

function moduleRoute(moduleRoot: string, file: string) {
  const modulePath = relative(moduleRoot, file).replaceAll("\\", "/");
  const segments = modulePath.split("/");
  const fileName = segments.pop()!;
  if (SPECIAL_ROUTES[fileName]) return SPECIAL_ROUTES[fileName];

  const directories = segments.filter(
    (segment) => !(segment.startsWith("(") && segment.endsWith(")")),
  );
  const identifier = fileName.replace(/\.js$/, "").replaceAll("_", "/");
  return posix.join("/", ...directories, identifier);
}

function extractQueryParameters(source: string) {
  const parameters = new Set<string>();
  for (const match of source.matchAll(/query(?:\.([A-Za-z_$][\w$]*)|\[['"]([^'"]+)['"]\])/g)) {
    parameters.add(match[1] ?? match[2]);
  }
  for (const destructuring of source.matchAll(/\{([^}]+)\}\s*=\s*query/g)) {
    for (const part of destructuring[1].split(",")) {
      const name = part.trim().split(/[:=]/)[0]?.trim();
      if (/^[A-Za-z_$][\w$]*$/.test(name)) parameters.add(name);
    }
  }
  return parameters;
}

function routeTitle(route: string) {
  return route
    .split("/")
    .filter(Boolean)
    .map((part) => part.replaceAll("-", " "))
    .join(" · ");
}

function operationId(route: string) {
  const parts = route.split("/").filter(Boolean);
  return `get${parts.map((part) => part.replace(/(^|[-_])([a-z])/g, (_, __, letter: string) => letter.toUpperCase())).join("")}`;
}

function resolveTag(route: string) {
  return (
    NETEASE_API_TAGS.find((tag) =>
      tag.prefixes.some((prefix) => route === prefix || route.startsWith(`${prefix}/`)),
    ) ?? NETEASE_API_TAGS.at(-1)!
  );
}

function parameterSchema(name: string, example?: string) {
  if (
    ["limit", "offset", "type", "s", "t", "time", "timestamp", "uid", "id"].includes(name) &&
    example &&
    /^\d+$/.test(example)
  ) {
    return { type: "integer", example: Number(example) };
  }
  if (["afresh", "refresh", "isAsc", "showInner"].includes(name)) {
    return { type: "boolean", example: example === "true" };
  }
  return { type: "string", ...(example ? { example } : {}) };
}

export async function generateNeteaseApiSchema(options: { backendRoot: string; output: string }) {
  const moduleRoot = resolve(options.backendRoot, "module");
  const legacyDocs = parseLegacyDocs(
    await readFile(resolve(options.backendRoot, "public/docs/home.md"), "utf8"),
  );
  const files = await collectModuleFiles(moduleRoot);
  const paths: Record<string, unknown> = {};

  for (const file of files.sort()) {
    const route = moduleRoute(moduleRoot, file);
    if (paths[route]) continue;

    const source = await readFile(file, "utf8");
    const legacy = legacyDocs.get(route);
    const parameterNames = extractQueryParameters(source);
    for (const parameter of legacy?.required ?? []) parameterNames.add(parameter);
    for (const parameter of legacy?.optional ?? []) parameterNames.add(parameter);
    parameterNames.delete("cookie");

    const parameters = [...parameterNames]
      .sort(
        (left, right) =>
          Number(legacy?.required.has(right)) - Number(legacy?.required.has(left)) ||
          left.localeCompare(right),
      )
      .map((name) => ({
        name,
        in: "query",
        required: legacy?.required.has(name) ?? false,
        description: legacy?.parameterDescriptions.get(name) ?? `后端模块读取的 ${name} 参数。`,
        schema: parameterSchema(name, legacy?.examples.get(name)),
      }));

    parameters.push({
      name: "cookie",
      in: "query",
      required: false,
      description: "可选的网易云登录 Cookie。不要在公共环境中使用真实凭据。",
      schema: { type: "string" },
    });

    const tag = resolveTag(route);
    const sourcePath = relative(options.backendRoot, file).replaceAll("\\", "/");
    paths[route] = {
      get: {
        operationId: operationId(route),
        summary: legacy?.title ?? routeTitle(route),
        description: `${legacy?.description ?? "该接口来自当前 Netease API Enhanced 后端模块。"} 来源模块：${sourcePath}。服务端兼容 GET 与 POST；本页以 GET 查询参数展示。`,
        tags: [tag.name],
        parameters,
        responses: {
          "200": {
            description: "后端返回的实际 JSON 结构因接口而异。使用请求面板可查看当前返回值。",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } },
            },
          },
          default: {
            description: "接口错误",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ApiError" } },
            },
          },
        },
      },
    };
  }

  const schema = {
    openapi: "3.1.0",
    info: {
      title: "Scopify Netease API",
      version: "4.40.0",
      description: `从 ${files.length} 个真实后端模块生成的接口目录。参数说明优先复用项目历史文档。`,
    },
    servers: [
      { url: "https://scopify-api.vercel.app", description: "Scopify Vercel 后端" },
      { url: "http://127.0.0.1:3838", description: "本地开发后端" },
    ],
    tags: NETEASE_API_TAGS.map(({ name, title, description }) => ({
      name,
      "x-displayName": title,
      description,
    })),
    paths,
    components: {
      schemas: {
        ApiResponse: {
          type: "object",
          properties: {
            code: { type: "integer", description: "网易云接口状态码。" },
            data: { description: "接口数据。", type: ["object", "array", "null"] },
            message: { type: "string" },
            msg: { type: "string" },
          },
          additionalProperties: true,
        },
        ApiError: {
          type: "object",
          properties: {
            code: { type: "integer", example: 400 },
            data: { type: ["object", "null"], additionalProperties: true },
            msg: { type: "string" },
          },
          additionalProperties: true,
        },
      },
    },
    "x-generated-by": "repo/frontend/apps/docs/scripts/generate-netease-schema.ts",
  };

  await mkdir(dirname(options.output), { recursive: true });
  await writeFile(options.output, `${JSON.stringify(schema, null, 2)}\n`, "utf8");
  return files.length;
}
