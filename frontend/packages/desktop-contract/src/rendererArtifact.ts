export const RENDERER_ARTIFACT_MANIFEST_VERSION = 1;

export interface RendererArtifactManifest {
  artifactSha256: string;
  bridgeProtocolVersion: number;
  buildTarget: "desktop";
  manifestVersion: typeof RENDERER_ARTIFACT_MANIFEST_VERSION;
  rendererVersion: string;
  sourceRevision: string;
}
