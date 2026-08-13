import { expect, test } from "bun:test";
import { hasRemoteMatch } from "next/dist/shared/lib/match-remote-pattern";
import {
  parseBackendPublicUrl,
  shouldUseUnoptimizedImages,
  WEB_IMAGE_REMOTE_PATTERNS,
} from "@/next.config";

test("parses environment-specific backend URLs", () => {
  expect(parseBackendPublicUrl("http://127.0.0.1:3838")).toEqual({
    host: "127.0.0.1",
    port: 3838,
    protocol: "http",
  });
  expect(parseBackendPublicUrl("https://scopify-api.vercel.app")).toEqual({
    host: "scopify-api.vercel.app",
    port: 443,
    protocol: "https",
  });
  expect(parseBackendPublicUrl("ftp://invalid.example")).toBeNull();
});

test("bypasses the image proxy in development and Desktop builds", () => {
  expect(shouldUseUnoptimizedImages(undefined, "development")).toBeTrue();
  expect(shouldUseUnoptimizedImages("desktop", "production")).toBeTrue();
  expect(shouldUseUnoptimizedImages(undefined, "production")).toBeFalse();
});

test("allows NetEase image CDN hosts used by API payloads", () => {
  const urls = [
    "https://p3.music.126.net/FFTgDupOwDn0WMMel32N_w==/109951169343945004.jpg",
    "http://p4.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg",
    "http://s1.music.126.net/style/web2/emt/emoji_86.png",
  ];

  for (const url of urls) {
    expect(hasRemoteMatch([], WEB_IMAGE_REMOTE_PATTERNS, new URL(url))).toBeTrue();
  }
});

test("allows known fallback artwork without opening arbitrary remote hosts", () => {
  expect(
    hasRemoteMatch(
      [],
      WEB_IMAGE_REMOTE_PATTERNS,
      new URL("https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17"),
    ),
  ).toBeTrue();
  expect(
    hasRemoteMatch([], WEB_IMAGE_REMOTE_PATTERNS, new URL("https://untrusted.example/cover.jpg")),
  ).toBeFalse();
});
