import { expect, test } from "bun:test";
import { getMacTrayLyricFrame } from "../electron/main/window/macTrayLyrics";

const text = "0123456789abcdefghijklmnopqrstuvwxyz";

test("short lines stay still without a scroll timer", () => {
  expect(getMacTrayLyricFrame("短歌词", 5000)).toEqual({ text: "短歌词", nextUpdateMs: null });
});

test("long lines hold at both ends and loop through the full text", () => {
  expect(getMacTrayLyricFrame(text, 0)).toEqual({ text: text.slice(0, 30), nextUpdateMs: 1200 });
  expect(getMacTrayLyricFrame(text, 1199).text).toBe(text.slice(0, 30));
  expect(getMacTrayLyricFrame(text, 1200).text).toBe(text.slice(1, 31));
  expect(getMacTrayLyricFrame(text, 2400).text).toBe(text.slice(6));
  expect(getMacTrayLyricFrame(text, 3839).text).toBe(text.slice(6));
  expect(getMacTrayLyricFrame(text, 3840).text).toBe(text.slice(0, 30));
});

test("scrolling preserves complete graphemes", () => {
  const character = "👩🏽‍💻";
  const accent = "e\u0301";
  const lyric = character + accent.repeat(30);
  expect(getMacTrayLyricFrame(lyric, 0).text).toBe(character + accent.repeat(29));
  expect(getMacTrayLyricFrame(lyric, 1200).text).toBe(accent.repeat(30));
});
