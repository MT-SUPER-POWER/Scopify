import { join } from "path";

export const __logoIcon = join(__dirname, "../resources/icon.ico");
export const __preloadScript = join(__dirname, "preload.cjs");

console.warn("Warning: __logoIcon path is", __logoIcon);
console.warn("Warning: __preloadScript path is", __preloadScript);
