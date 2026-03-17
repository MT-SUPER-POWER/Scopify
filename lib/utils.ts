import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getColorSync } from "colorthief";

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
        let rgb: number[] | undefined;
        if (color && typeof (color as any).css === "function" && Array.isArray((color as any).rgb)) {
          rgb = (color as any).rgb;
        } else if (Array.isArray(color)) {
          rgb = color;
        } else if (
          color && typeof color === "object" &&
          typeof (color as any)._r === "number" &&
          typeof (color as any)._g === "number" &&
          typeof (color as any)._b === "number"
        ) {
          rgb = [(color as any)._r, (color as any)._g, (color as any)._b];
        }
        if (rgb && rgb.length === 3) {
          // 转 #RRGGBB
          const hex = `#${rgb.map(x => x.toString(16).padStart(2, "0")).join("")}`;
          resolve(hex);
        } else {
          console.error("提取结果格式异常:", color);
          resolve("");
        }
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

export const isElectron = (): boolean => {
  // 方法1：检查 userAgent
  if (typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron')) {
    return true;
  }
  // 方法2：检查 preload 注入的 API
  if (typeof window !== 'undefined' && window.electronAPI) {
    return true;
  }
  // 方法3：检查 process
  if (typeof process !== 'undefined' && process.versions?.electron) {
    return true;
  }
  return false;
};

export const isWeb = (): boolean => !isElectron();

// 也可以做成常量，避免重复调用
export const IS_ELECTRON = isElectron();
export const IS_WEB = !IS_ELECTRON;
