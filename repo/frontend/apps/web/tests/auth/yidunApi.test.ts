import { afterEach, expect, test } from "bun:test";
import request from "@/lib/providers/netease/client";
import { getYidunErrorMessage } from "@/lib/auth/yidunError";
import { loginWithYidun, sendYidunCaptcha } from "@/lib/api/yidun";
import type { NeteaseRequestConfig } from "@/types/providers/netease/request";

const originalAdapter = request.defaults.adapter;
afterEach(() => {
  request.defaults.adapter = originalAdapter;
});

test("risk responses survive HTTP errors and both steps keep the same isolated session", async () => {
  const calls: { url?: string; sid: string }[] = [];
  request.defaults.adapter = async (config) => {
    const body = JSON.parse(String(config.data)) as {
      sid: string;
      password?: string;
      countrycode?: string;
      ctcode?: string;
    };
    calls.push({ url: config.url, sid: body.sid });
    expect(config.method).toBe("post");
    expect((config as NeteaseRequestConfig).noLogin).toBe(true);
    expect(config.params).toEqual({});
    expect(config.withCredentials).toBe(false);
    expect(body.countrycode).toBe("852");
    expect(body.ctcode).toBe("852");
    expect(config.params.password).toBeUndefined();
    expect(config.validateStatus?.(400)).toBe(true);
    return {
      data: { code: config.url === "/yidun/login" ? 8830 : 8821 },
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config,
    };
  };
  const login = await loginWithYidun({
    sid: "unique-session",
    phone: "13800000000",
    password: "private-password",
    countrycode: "852",
  });
  const send = await sendYidunCaptcha({
    sid: "unique-session",
    phone: "13800000000",
    countrycode: "852",
  });
  expect(login.data.code).toBe(8830);
  expect(send.data.code).toBe(8821);
  expect(calls).toEqual([
    { url: "/yidun/login", sid: "unique-session" },
    { url: "/yidun/send", sid: "unique-session" },
  ]);
});

test("credential failures remain rejected instead of becoming successful logins", async () => {
  request.defaults.adapter = async (config) => ({
    data: { code: 502, msg: "Incorrect password" },
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  });
  await expect(
    loginWithYidun({ sid: "unique-session", phone: "13800000000", password: "wrong" }),
  ).rejects.toThrow("Incorrect password");
});

test("HTTP 400 with business code 10004 preserves the risk reason and business code", async () => {
  let requests = 0;
  request.defaults.adapter = async (config) => {
    requests++;
    return {
      data: {
        code: 10004,
        msg: "当前登录存在安全风险，请稍后再试",
        body: {
          code: 10004,
          message: "当前登录存在安全风险，请稍后再试",
          redirectUrl:
            "https://st.music.163.com/st/user-new/phoneReuse/index.html?NMSCVT=test-ticket&systemOs=pc",
        },
      },
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config,
    };
  };
  const error = await sendYidunCaptcha({ sid: "risk-session", phone: "13800000000" }).catch(
    (failure: unknown) => failure,
  );
  expect(getYidunErrorMessage(error, "发送验证码失败")).toBe(
    "当前登录存在安全风险，请稍后再试 (10004)",
  );
  expect(requests).toBe(1);
});
