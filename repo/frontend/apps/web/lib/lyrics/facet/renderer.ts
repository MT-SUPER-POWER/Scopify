import { FACET_SHADER_BASE_URL } from "@/constants/facetBackground";
import type { FacetRenderOptions, FacetShaderSources } from "@/types/lyrics/facet/background";

// lib/lyrics/facet/renderer.ts
// Facet's WebGL2 passes: the scene with its history, an optional downsampled bloom, and the composite to the canvas.
// The fragment shaders are separately licensed files under public/folia/facet (see the NOTICE.md there), so they
// are fetched rather than bundled.

const VERTEX_SHADER = `#version 300 es
out vec2 vUv;
void main() {
  vec2 corner = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = corner;
  gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}`;

const COMPILE_POLL_MS = 16;
const BLOOM_DOWNSAMPLE = 4;
const BLOOM_RADIUS = 0.02;
const BLOOM_GAIN = 0.6;
const VIGNETTE = 0.35;
const LYRIC_BAND = 0.55;
const MAX_TURNS = 7;
const MAX_PIXEL_RATIO = 2;

interface Program {
  handle: WebGLProgram;
  uniforms: Map<string, WebGLUniformLocation | null>;
}
interface Target {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  width: number;
  height: number;
}

export async function loadFacetShaders(signal: AbortSignal): Promise<FacetShaderSources> {
  const load = async (name: string) => {
    const response = await fetch(`${FACET_SHADER_BASE_URL}/${name}.frag`, { signal });
    if (!response.ok) throw new Error(`Facet shader ${name}: HTTP ${response.status}`);
    return response.text();
  };
  const [scene, bloom, composite] = await Promise.all([
    load("scene"),
    load("bloom"),
    load("composite"),
  ]);
  return { scene, bloom, composite };
}

export class FacetRenderer {
  readonly adapter: string;
  private readonly gl: WebGL2RenderingContext;
  private readonly vao: WebGLVertexArrayObject;
  private programs: { scene: Program; bloom: Program; composite: Program } | null = null;
  private history: [Target, Target] | null = null;
  private bloom: Target | null = null;
  private frame = 0;
  private readonly timerExtension: { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null;
  private timerQuery: WebGLQuery | null = null;
  private timerPending = false;
  private timerSum = 0;
  private timerCount = 0;
  private readonly centres = new Float32Array(MAX_TURNS * 2);

  constructor(private readonly canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("WebGL2 unavailable");
    this.gl = gl;
    const debug = gl.getExtension("WEBGL_debug_renderer_info");
    this.adapter = String(
      gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? "unknown",
    );
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    this.timerExtension = gl.getExtension("EXT_disjoint_timer_query_webgl2");
  }

  /** Links the programs without blocking the main thread where the driver allows it. */
  async compile(sources: FacetShaderSources, signal: AbortSignal) {
    const { gl } = this;
    const parallel = gl.getExtension("KHR_parallel_shader_compile");
    const start = (fragment: string) => {
      const vertexShader = this.shader(gl.VERTEX_SHADER, VERTEX_SHADER);
      const fragmentShader = this.shader(gl.FRAGMENT_SHADER, fragment);
      const handle = gl.createProgram();
      gl.attachShader(handle, vertexShader);
      gl.attachShader(handle, fragmentShader);
      gl.linkProgram(handle);
      return { handle, vertexShader, fragmentShader };
    };
    const scene = start(sources.scene);
    const bloom = start(sources.bloom);
    const composite = start(sources.composite);
    const pending = [scene, bloom, composite];
    if (parallel) {
      const done = (handle: WebGLProgram) =>
        gl.getProgramParameter(handle, parallel.COMPLETION_STATUS_KHR) as boolean;
      while (!pending.every(({ handle }) => done(handle))) {
        signal.throwIfAborted();
        await new Promise((resolve) => setTimeout(resolve, COMPILE_POLL_MS));
      }
    }
    const finish = ({ handle, vertexShader, fragmentShader }: (typeof pending)[number]) => {
      if (!gl.getProgramParameter(handle, gl.LINK_STATUS)) {
        const log = gl.getShaderInfoLog(fragmentShader) || gl.getProgramInfoLog(handle);
        throw new Error(`Facet shader link failed: ${log}`);
      }
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return { handle, uniforms: new Map() } satisfies Program;
    };
    this.programs = { scene: finish(scene), bloom: finish(bloom), composite: finish(composite) };
  }

  private shader(type: number, source: string) {
    const { gl } = this;
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Facet shader allocation failed");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  private location(program: Program, name: string) {
    if (!program.uniforms.has(name)) {
      program.uniforms.set(name, this.gl.getUniformLocation(program.handle, name));
    }
    return program.uniforms.get(name) ?? null;
  }

  private createTarget(width: number, height: number): Target {
    const { gl } = this;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { texture, framebuffer, width, height };
  }

  private deleteTarget(target: Target | null | undefined) {
    if (!target) return;
    this.gl.deleteTexture(target.texture);
    this.gl.deleteFramebuffer(target.framebuffer);
  }

  private deleteTargets() {
    this.deleteTarget(this.history?.[0]);
    this.deleteTarget(this.history?.[1]);
    this.deleteTarget(this.bloom);
  }

  /** Sizes the buffers to `width` x `height` CSS pixels, within the pixel budget. Returns whether anything changed. */
  resize(width: number, height: number, maxPixels: number, scale: number) {
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    const full = width * height * ratio * ratio;
    const fit = Math.min(1, Math.sqrt(maxPixels / Math.max(full, 1))) * scale * ratio;
    const pixelWidth = Math.max(2, Math.round(width * fit));
    const pixelHeight = Math.max(2, Math.round(height * fit));
    if (this.history && this.canvas.width === pixelWidth && this.canvas.height === pixelHeight) {
      return false;
    }
    this.canvas.width = pixelWidth;
    this.canvas.height = pixelHeight;
    this.deleteTargets();
    this.history = [
      this.createTarget(pixelWidth, pixelHeight),
      this.createTarget(pixelWidth, pixelHeight),
    ];
    this.bloom = this.createTarget(
      Math.max(2, Math.round(pixelWidth / BLOOM_DOWNSAMPLE)),
      Math.max(2, Math.round(pixelHeight / BLOOM_DOWNSAMPLE)),
    );
    return true;
  }

  private draw(target: Target | null) {
    const { gl } = this;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target?.framebuffer ?? null);
    gl.viewport(0, 0, target?.width ?? this.canvas.width, target?.height ?? this.canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private bindTexture(unit: number, texture: WebGLTexture) {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
  }

  render({
    motion,
    palette,
    quality,
    seed,
    historyWeight,
    maxDelta,
    samples,
    vignette,
  }: FacetRenderOptions) {
    const { gl, programs, history, bloom, timerExtension } = this;
    if (!programs || !history || !bloom) return;
    this.readTimer();
    const timing = timerExtension !== null && !this.timerPending;
    if (timing) {
      this.timerQuery ??= gl.createQuery();
      gl.beginQuery(timerExtension.TIME_ELAPSED_EXT, this.timerQuery);
    }
    const [previous, current] = history;
    this.frame = (this.frame + 1) % 0x7fffffff;

    const { scene } = programs;
    gl.useProgram(scene.handle);
    const at = (name: string) => this.location(scene, name);
    gl.uniform2f(at("uResolution"), current.width, current.height);
    gl.uniform1f(at("uFlow"), motion.flow);
    gl.uniform1f(at("uBlend"), motion.blend);
    gl.uniform1f(at("uScale"), motion.scale);
    gl.uniform1f(at("uPresence"), motion.presence);
    gl.uniform1i(at("uTick"), motion.tick);
    gl.uniform1i(at("uFrame"), this.frame);
    gl.uniform1i(at("uSamples"), samples);
    gl.uniform1i(at("uTurns"), quality.turns);
    gl.uniform1i(at("uRipples"), quality.ripples);
    for (let turn = 0; turn < quality.turns; turn += 1) {
      const angle = (Math.PI * 2 * turn) / quality.turns;
      this.centres[turn * 2] = Math.cos(angle);
      this.centres[turn * 2 + 1] = Math.sin(angle);
    }
    gl.uniform2fv(at("uCentres"), this.centres);
    gl.uniform3fv(at("uPaper"), palette.paper);
    gl.uniform3fv(at("uInk"), palette.ink);
    gl.uniform3fv(at("uAccent"), palette.accent);
    gl.uniform3fv(at("uSecondary"), palette.secondary);
    gl.uniform1f(at("uSeed"), seed);
    gl.uniform1f(at("uThickness"), motion.thickness);
    gl.uniform1f(at("uGrain"), motion.grain);
    gl.uniform1f(at("uBurst"), motion.burst);
    const { tear } = motion;
    gl.uniform4f(
      at("uTear"),
      tear?.y ?? 0,
      tear?.height ?? 0,
      tear?.shiftX ?? 0,
      tear?.shiftY ?? 0,
    );
    gl.uniform1f(at("uHistoryWeight"), historyWeight);
    gl.uniform1f(at("uMaxDelta"), maxDelta);
    gl.uniform1i(at("uHistory"), 0);
    this.bindTexture(0, previous.texture);
    this.draw(current);

    if (quality.bloom) {
      gl.useProgram(programs.bloom.handle);
      gl.uniform1i(this.location(programs.bloom, "uScene"), 0);
      gl.uniform2f(
        this.location(programs.bloom, "uRadius"),
        (BLOOM_RADIUS * current.height) / current.width,
        BLOOM_RADIUS,
      );
      this.bindTexture(0, current.texture);
      this.draw(bloom);
    }

    const { composite } = programs;
    gl.useProgram(composite.handle);
    gl.uniform1i(this.location(composite, "uScene"), 0);
    gl.uniform1i(this.location(composite, "uBloom"), 1);
    gl.uniform3fv(this.location(composite, "uPaper"), palette.paper);
    gl.uniform1f(this.location(composite, "uBloomGain"), quality.bloom ? BLOOM_GAIN : 0);
    gl.uniform1f(this.location(composite, "uVignette"), vignette ? VIGNETTE : 0);
    gl.uniform1f(this.location(composite, "uAspect"), current.width / current.height);
    gl.uniform1f(this.location(composite, "uLyricBand"), LYRIC_BAND);
    this.bindTexture(0, current.texture);
    this.bindTexture(1, bloom.texture);
    this.draw(null);

    if (timing) {
      gl.endQuery(timerExtension.TIME_ELAPSED_EXT);
      this.timerPending = true;
    }
    this.history = [current, previous];
  }

  private readTimer() {
    const { gl, timerExtension, timerQuery } = this;
    if (!timerExtension || !this.timerPending || !timerQuery) return;
    if (!gl.getQueryParameter(timerQuery, gl.QUERY_RESULT_AVAILABLE)) return;
    this.timerPending = false;
    if (gl.getParameter(timerExtension.GPU_DISJOINT_EXT)) return;
    this.timerSum += (gl.getQueryParameter(timerQuery, gl.QUERY_RESULT) as number) / 1e6;
    this.timerCount += 1;
  }

  /** Average GPU milliseconds per frame since the last call, or null where the driver has no timer. */
  takeGpuMs() {
    const average = this.timerCount > 0 ? this.timerSum / this.timerCount : null;
    this.timerSum = 0;
    this.timerCount = 0;
    return average;
  }

  get size() {
    return { width: this.canvas.width, height: this.canvas.height };
  }

  dispose() {
    const { gl, programs } = this;
    if (programs) {
      gl.deleteProgram(programs.scene.handle);
      gl.deleteProgram(programs.bloom.handle);
      gl.deleteProgram(programs.composite.handle);
    }
    this.deleteTargets();
    if (this.timerQuery) gl.deleteQuery(this.timerQuery);
    gl.deleteVertexArray(this.vao);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
