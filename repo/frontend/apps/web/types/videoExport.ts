export interface VideoExportPreset {
  readonly id: "720p" | "1080p" | "portrait";
  readonly width: number;
  readonly height: number;
}

export interface VideoExportCropGeometry {
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
  mode: "pure-crop" | "cover";
}
