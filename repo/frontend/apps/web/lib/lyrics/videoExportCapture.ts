import type { VideoExportCropGeometry, VideoExportPreset } from "@/types/videoExport";

const EXPORT_FRAME_RATE = 60;

export function resolveVideoExportCropGeometry(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
): VideoExportCropGeometry {
  const safeSourceWidth = Math.max(1, Math.round(sourceWidth));
  const safeSourceHeight = Math.max(1, Math.round(sourceHeight));

  if (safeSourceWidth >= targetWidth && safeSourceHeight >= targetHeight) {
    return {
      sourceX: Math.floor((safeSourceWidth - targetWidth) / 2),
      sourceY: Math.floor((safeSourceHeight - targetHeight) / 2),
      sourceWidth: targetWidth,
      sourceHeight: targetHeight,
      mode: "pure-crop",
    };
  }

  const sourceAspect = safeSourceWidth / safeSourceHeight;
  const targetAspect = targetWidth / targetHeight;
  if (sourceAspect > targetAspect) {
    const cropWidth = Math.max(1, Math.round(safeSourceHeight * targetAspect));
    return {
      sourceX: Math.floor((safeSourceWidth - cropWidth) / 2),
      sourceY: 0,
      sourceWidth: cropWidth,
      sourceHeight: safeSourceHeight,
      mode: "cover",
    };
  }

  const cropHeight = Math.max(1, Math.round(safeSourceWidth / targetAspect));
  return {
    sourceX: 0,
    sourceY: Math.floor((safeSourceHeight - cropHeight) / 2),
    sourceWidth: safeSourceWidth,
    sourceHeight: cropHeight,
    mode: "cover",
  };
}

export function createCroppedVideoStream(
  sourceStream: MediaStream,
  preset: VideoExportPreset,
): { stream: MediaStream; cleanup: () => void } {
  const videoTrack = sourceStream.getVideoTracks()[0];
  if (!videoTrack) throw new Error("[VideoExport] capture source has no video track");

  const canvas = document.createElement("canvas");
  canvas.width = preset.width;
  canvas.height = preset.height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    canvas.remove();
    throw new Error("[VideoExport] failed to create the crop canvas");
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  const video = document.createElement("video");
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  video.srcObject = new MediaStream([videoTrack]);

  let animationFrameId: number | null = null;
  let running = true;
  let geometry: VideoExportCropGeometry | null = null;
  const renderFrame = () => {
    if (!running) return;
    if (geometry && video.readyState >= video.HAVE_CURRENT_DATA) {
      context.drawImage(
        video,
        geometry.sourceX,
        geometry.sourceY,
        geometry.sourceWidth,
        geometry.sourceHeight,
        0,
        0,
        preset.width,
        preset.height,
      );
    }
    animationFrameId = requestAnimationFrame(renderFrame);
  };

  video.onloadedmetadata = () => {
    geometry = resolveVideoExportCropGeometry(
      video.videoWidth || preset.width,
      video.videoHeight || preset.height,
      preset.width,
      preset.height,
    );
    renderFrame();
  };

  const stream = canvas.captureStream(EXPORT_FRAME_RATE);
  const cleanup = () => {
    running = false;
    if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
    sourceStream.getTracks().forEach((track) => track.stop());
    video.pause();
    video.srcObject = null;
    video.remove();
    canvas.remove();
  };

  return { stream, cleanup };
}
