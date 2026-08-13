import { type ClassValue, clsx } from "clsx";
import { getColorSync } from "colorthief";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 提取图片主色调 (使用最新版 colorthief 库)
 * @param imageUrl 图片地址
 * @returns Promise<string> rgb格式的颜色字符串
 */
export function getMainColorFromImage(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      console.error("主色调提取逻辑仅支持浏览器环境 (Canvas API/Image)");
      return resolve("");
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      try {
        const color = getColorSync(img);
        resolve(color?.hex() ?? "");
      } catch (e) {
        console.error(e);
        resolve("");
      }
    };

    img.onerror = () => {
      console.error(`图片加载失败: ${imageUrl}`);
      resolve("");
    };

    img.src = imageUrl;
  });
}

/**
 * 毫秒转 mm:ss 格式
 */
export const formatDuration = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

/**
 * 数字千分位格式化
 */
export const formatNumber = (num: number) => new Intl.NumberFormat("en-US").format(num);

/**
 * 时间戳转日期格式
 */
export const formatDate = (timestamp: number) => {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

// TODO: 未来适配国际版本的计数模式
export const formatPlayCount = (count: number) => {
  // 亿及以上 (100,000,000)
  if (count >= 100_000_000) {
    return (count / 100_000_000).toFixed(1).replace(/\.0$/, "") + "亿";
  }
  // 万及以上 (10,000)
  if (count >= 10_000) {
    // 比如 12500 -> 1.2万，如果不需要小数可以直接 Math.floor(count / 10000) + "万"
    return (count / 10_000).toFixed(1).replace(/\.0$/, "") + "万";
  }
  return count.toString();
};

/** 网易云风格紧凑计数：999+、10w+ */
export const formatCompactCount = (count: number) => {
  if (count >= 100000) return `${Math.floor(count / 10000)}w+`;
  if (count >= 10000) return `${Math.round(count / 1000) / 10}w+`.replace(".0w+", "w+");
  if (count > 999) return "999+";
  return count.toString();
};
