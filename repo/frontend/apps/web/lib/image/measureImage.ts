/**
 * 参考后端案例 public/playlist_cover_update.html
 * 使用 FileReader 与 HTMLImageElement 读取图片的天然尺寸
 */
export function measureImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve({ width: 300, height: 300 });
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = (e.target?.result as string) || "";
      img.onload = () => {
        resolve({
          width: img.naturalWidth || img.width || 300,
          height: img.naturalHeight || img.height || 300,
        });
      };
      img.onerror = () => reject(new Error("图片加载失败"));
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
  });
}
