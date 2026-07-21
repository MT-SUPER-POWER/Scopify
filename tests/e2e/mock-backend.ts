const port = Number(process.env.PLAYWRIGHT_BACKEND_PORT ?? 3839);
const allowedOrigin = "http://127.0.0.1:3111";

const albumModes = new Map<string, "delayed" | "fail" | "success">();

const albumResponse = {
  album: {
    artist: {
      id: 2001,
      name: "E2E Test Artist",
      picUrl: "/icon.ico",
    },
    company: "Scopify Test Records",
    description: "A deterministic album response for browser acceptance.",
    name: "E2E Test Album",
    picUrl: "/icon.ico",
    publishTime: 1_704_067_200_000,
    size: 1,
    subType: "Studio",
    type: "Album",
  },
  code: 200,
  songs: [
    {
      al: {
        id: 1001,
        name: "E2E Test Album",
        picUrl: "/icon.ico",
      },
      ar: [{ id: 2001, name: "E2E Test Artist" }],
      dt: 210_000,
      id: 3001,
      name: "E2E Test Track",
      publishTime: 1_704_067_200_000,
    },
  ],
};

function response(body: unknown, status = 200) {
  return Response.json(body, {
    headers: {
      "access-control-allow-credentials": "true",
      "access-control-allow-origin": allowedOrigin,
    },
    status,
  });
}

Bun.serve({
  fetch: async (request) => {
    const url = new URL(request.url);

    if (url.pathname === "/health") return response({ ok: true });

    if (url.pathname === "/__test__/album-mode" && request.method === "POST") {
      const body = (await request.json()) as { albumId?: unknown; mode?: unknown };
      if (body.mode !== "delayed" && body.mode !== "fail" && body.mode !== "success") {
        return response({ message: "Unknown album mode" }, 400);
      }
      if (typeof body.albumId !== "string") {
        return response({ message: "Album ID is required" }, 400);
      }

      albumModes.set(body.albumId, body.mode);
      return response({ mode: body.mode });
    }

    if (url.pathname === "/album" || url.pathname === "/album/") {
      const albumId = url.searchParams.get("id") ?? "";
      const albumMode = albumModes.get(albumId);
      if (albumMode === "delayed") {
        await Bun.sleep(2_000);
      }
      if (albumMode === "fail") {
        return response({ code: 500, message: "Album service unavailable" }, 500);
      }

      return response(albumResponse);
    }

    return response({ code: 200 });
  },
  hostname: "127.0.0.1",
  port,
});
