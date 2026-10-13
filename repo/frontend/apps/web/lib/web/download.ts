// Browser file downloads (Folia src/utils/downloadFileName.ts): file names an `a[download]` can
// carry on every OS, and the anchor dance that hands a Blob to the browser's save flow.
const ILLEGAL = /[<>:"/\\|?*]/g;

// Control characters (below U+0020) are refused everywhere as well.
const replaceControlCharacters = (value: string) =>
  Array.from(value, (char) => (char.charCodeAt(0) < 0x20 ? "_" : char)).join("");

// Device names Windows reserves whatever the extension: `CON.zip` is as unusable as `CON`.
const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;

/**
 * Strips the characters Windows, macOS and Linux all refuse in a filename and collapses the
 * whitespace left behind. Trailing dots and spaces go too (Windows silently drops them), and a
 * reserved device name such as `CON` gets a leading `_`.
 */
export const sanitizeDownloadFileName = (name: string, fallback = "download"): string => {
  const cleaned = replaceControlCharacters(name)
    .replace(ILLEGAL, "_")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/, "");
  if (!cleaned) return fallback;
  return WINDOWS_RESERVED.test(cleaned) ? `_${cleaned}` : cleaned;
};

/** Local `YYYY-MM-DD`, not `toISOString`: the latter is UTC and shifts a day for most users. */
export const formatLocalDateStamp = (date = new Date()): string => {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

/** Saves a Blob under `fileName`; the object URL is released once the click has been handled. */
export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};
