import * as THREE from "three";

import {
  fitView,
  SEAT_HALF_TAN,
} from "@/components/lyrics/folia/src/components/scenes/cinema/cinemaCamera";
import { SCREEN } from "@/components/lyrics/folia/src/components/scenes/cinema/cinemaLayout";
import { loadCinemaReel } from "@/components/lyrics/folia/src/components/scenes/cinema/cinemaReel";
import { createCinemaScene } from "@/components/lyrics/folia/src/components/scenes/cinema/cinemaScene";
import { resolveCinemaSeat } from "@/lib/lyrics/cinema/seats";
import { useCinemaSceneStore } from "@/store/module/cinemaScene";
import type { CinemaRuntime, CinemaSceneInputs } from "@/types/lyrics/cinema";

const QUALITY_DPR = { low: 1, medium: 1.25, high: 1.5 };
const YAW_LIMIT = THREE.MathUtils.degToRad(80);
const PITCH_LIMIT = THREE.MathUtils.degToRad(89);

/** Project the lyric DOM underneath the transparent screen in the cinema canvas. */
function createScreenProjection(element: HTMLDivElement) {
  const viewProjection = new THREE.Matrix4();
  const topLeft = new THREE.Vector4();
  const topRight = new THREE.Vector4();
  const bottomLeft = new THREE.Vector4();
  let lastPlacement = "";

  return (camera: THREE.Camera, width: number, height: number, open: boolean) => {
    if (!open) {
      element.style.visibility = "hidden";
      return;
    }

    const halfWidth = SCREEN.width / 2;
    const top = SCREEN.centerY + SCREEN.height / 2;
    const bottom = SCREEN.centerY - SCREEN.height / 2;
    viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    topLeft.set(-halfWidth, top, SCREEN.z, 1).applyMatrix4(viewProjection);
    topRight.set(halfWidth, top, SCREEN.z, 1).applyMatrix4(viewProjection);
    bottomLeft.set(-halfWidth, bottom, SCREEN.z, 1).applyMatrix4(viewProjection);

    const bottomRightW = topRight.w + bottomLeft.w - topLeft.w;
    if (Math.max(topLeft.w, topRight.w, bottomLeft.w, bottomRightW) <= 0) {
      element.style.visibility = "hidden";
      return;
    }

    // Keep w homogeneous so the browser clips any part of the screen behind the camera.
    const scale = Math.max(
      Math.abs(topLeft.w),
      Math.abs(topRight.w),
      Math.abs(bottomLeft.w),
      Math.abs(bottomRightW),
    );
    const screenHeight = Math.max(1, Math.round((width * SCREEN.height) / SCREEN.width));
    const pixelX = (point: THREE.Vector4) => ((point.x + point.w) * width) / 2;
    const pixelY = (point: THREE.Vector4) => ((point.w - point.y) * height) / 2;
    const x = pixelX(topLeft);
    const y = pixelY(topLeft);
    const matrix = [
      (pixelX(topRight) - x) / (width * scale),
      (pixelY(topRight) - y) / (width * scale),
      0,
      (topRight.w - topLeft.w) / (width * scale),
      (pixelX(bottomLeft) - x) / (screenHeight * scale),
      (pixelY(bottomLeft) - y) / (screenHeight * scale),
      0,
      (bottomLeft.w - topLeft.w) / (screenHeight * scale),
      0,
      0,
      1,
      0,
      x / scale,
      y / scale,
      0,
      topLeft.w / scale,
    ];
    const transform = `matrix3d(${matrix.map((value) => value.toFixed(9)).join(",")})`;
    const placement = `${width}x${screenHeight}:${transform}`;

    element.style.visibility = "visible";
    if (placement === lastPlacement) return;
    lastPlacement = placement;
    element.style.width = `${width}px`;
    element.style.height = `${screenHeight}px`;
    element.style.transform = transform;
  };
}

export async function createCinemaRuntime(
  container: HTMLDivElement,
  screen: HTMLDivElement,
  signal: AbortSignal,
  onContextLost: (error: Error) => void,
): Promise<CinemaRuntime | null> {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: false,
    powerPreference: "high-performance",
  });
  const { domElement: canvas } = renderer;
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 90);
  const bufferSize = new THREE.Vector2();
  const cove = new THREE.Color();
  const projectScreen = createScreenProjection(screen);
  let hall: Awaited<ReturnType<typeof createCinemaScene>> | undefined;
  let width = 1;
  let height = 1;
  let drawnWidth = 0;
  let drawnHeight = 0;
  let drawnDpr = 0;
  let placedScreen = false;
  let disposed = false;

  const measure = () => {
    width = Math.max(1, container.clientWidth);
    height = Math.max(1, container.clientHeight);
  };
  const observer = new ResizeObserver(measure);
  const contextLost = (event: Event) => {
    event.preventDefault();
    onContextLost(new Error("Cinema WebGL context lost"));
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    observer.disconnect();
    canvas.removeEventListener("webglcontextlost", contextLost);
    hall?.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
    if (placedScreen) {
      screen.style.removeProperty("width");
      screen.style.removeProperty("height");
      screen.style.removeProperty("transform");
      screen.style.removeProperty("visibility");
    }
  };

  let shaderError: Error | undefined;
  renderer.debug.onShaderError = (gl, program) => {
    shaderError = new Error(gl.getProgramInfoLog(program) || "Cinema shader compilation failed");
  };
  const checkShaders = () => {
    if (shaderError) throw shaderError;
  };

  let ready = false;
  try {
    // The hall's lens, haze and bloom passes render to half-float targets.
    if (
      !renderer.extensions.has("EXT_color_buffer_float") &&
      !renderer.extensions.has("EXT_color_buffer_half_float")
    ) {
      throw new Error("Cinema requires renderable half-float textures");
    }
    canvas.className = "absolute inset-0 size-full";
    canvas.addEventListener("webglcontextlost", contextLost);
    container.appendChild(canvas);
    measure();
    observer.observe(container);

    const scene = await createCinemaScene();
    hall = scene;
    if (signal.aborted) return null;

    let seatId = useCinemaSceneStore.getState().seatId;
    let seat = resolveCinemaSeat(seatId);
    let cameraRevision = useCinemaSceneStore.getState().cameraRevision;
    let yaw = 0;
    let pitch = 0;
    const aim = () => {
      const [x, y, z] = seat.eye;
      const baseYaw = Math.atan2(x, z);
      const basePitch = Math.atan2(SCREEN.centerY - 0.2 - y, Math.hypot(x, z));
      pitch = THREE.MathUtils.clamp(pitch, -PITCH_LIMIT - basePitch, PITCH_LIMIT - basePitch);
      camera.position.set(x, y, z);
      camera.rotation.set(basePitch + pitch, baseYaw + yaw, 0, "YXZ");
      camera.updateMatrixWorld();
    };
    const resize = () => {
      const { quality } = useCinemaSceneStore.getState();
      const dpr = QUALITY_DPR[quality] ?? QUALITY_DPR.medium;
      if (width === drawnWidth && height === drawnHeight && dpr === drawnDpr) return;
      drawnWidth = width;
      drawnHeight = height;
      drawnDpr = dpr;
      renderer.setDrawingBufferSize(width, height, dpr);
      camera.aspect = width / height;
      fitView(camera, SEAT_HALF_TAN);
      camera.updateProjectionMatrix();
      renderer.getDrawingBufferSize(bufferSize);
    };
    resize();
    aim();
    await scene.compile(renderer, camera, signal);
    if (signal.aborted) return null;
    checkShaders();

    let lastNow = 0;
    let artwork: string | null = null;
    let reelRequest = 0;
    let accent = "";
    const warmWhite = new THREE.Color("#ffd6a8");
    const accentLight = new THREE.Color();

    const updateReel = (inputs: CinemaSceneInputs) => {
      if (accent !== inputs.accentColor) {
        accent = inputs.accentColor;
        cove.copy(warmWhite).lerp(accentLight.set(accent), 0.4);
      }
      if (inputs.artworkUrl === artwork) return;
      const animate = inputs.bridge.isPlaying && !inputs.reducedMotion;
      artwork = inputs.artworkUrl;
      const request = ++reelRequest;
      if (!artwork) {
        scene.setReel(null, animate);
        return;
      }
      void loadCinemaReel(artwork).then((reel) => {
        if (disposed || request !== reelRequest) {
          reel?.texture.dispose();
          return;
        }
        scene.setReel(reel, animate);
      });
    };

    const draw = (now: number, inputs: CinemaSceneInputs) => {
      if (placedScreen && !inputs.active) {
        lastNow = 0;
        return;
      }
      const { bridge, reducedMotion } = inputs;
      const settings = useCinemaSceneStore.getState();
      if (settings.seatId !== seatId || settings.cameraRevision !== cameraRevision) {
        seatId = settings.seatId;
        seat = resolveCinemaSeat(seatId);
        cameraRevision = settings.cameraRevision;
        yaw = 0;
        pitch = 0;
      }
      resize();
      aim();
      updateReel(inputs);

      const dt = lastNow && !reducedMotion ? Math.min(0.1, (now - lastNow) / 1_000) : 0;
      lastNow = now;
      const shutter = scene.update({
        dt,
        running: bridge.isPlaying,
        power: reducedMotion ? 0 : bridge.audioPower.get(),
        bass: reducedMotion ? 0 : bridge.audioBands.bass.get(),
        lightsUp: settings.houseLights,
        curtainsOnPause: settings.curtainsOnPause,
        still: reducedMotion,
        cove,
        camera,
        bufferSize,
      });
      scene.render(renderer, camera);
      checkShaders();
      projectScreen(camera, width, height, shutter > 0);
      placedScreen = true;
    };

    ready = true;
    return {
      draw,
      turn: (horizontal, vertical) => {
        yaw = THREE.MathUtils.clamp(yaw + horizontal, -YAW_LIMIT, YAW_LIMIT);
        pitch += vertical;
      },
      dispose,
    };
  } finally {
    if (!ready) dispose();
  }
}
