import { at } from "./at";
import type { PrismaBatchData, PrismaLineLayout } from "@/types/lyrics/prisma/model";
import type { PrismaPlateImage } from "./raster";
import { PRISMA_BATCH_STRIDE } from "./batch";
import {
  EMPTY_FRAGMENT,
  GLYPH_FRAGMENT,
  GLYPH_VERTEX,
  SHARD_FRAGMENT,
  SHARD_PATH_VERTEX,
  SHARD_VERTEX,
} from "./shaders";

// lib/lyrics/prisma/gl.ts
// Everything that talks to WebGL2. Programs compile in the background and are only used once ready. There is
// no depth buffer: shards are one colour family and blend, so their order barely shows and overdraw is cheap.

export const PRISMA_PLATE_LAYERS = 6;

const DYNAMIC_STRIDE = 48;
const GLYPH_STRIDE = 36;
const PATH_VARYINGS = ["v_state", "v_motion", "v_look"];
const COMPLETION_STATUS_KHR = 0x91b1;

export const PRISMA_CONTEXT_ATTRIBUTES: WebGLContextAttributes = {
  alpha: true,
  premultipliedAlpha: true,
  antialias: true,
  depth: false,
  stencil: false,
  powerPreference: "high-performance",
};

type Uniforms = Record<string, WebGLUniformLocation | null>;

interface PendingProgram {
  program: WebGLProgram;
  vertex: WebGLShader;
  fragment: WebGLShader;
  name: string;
}

const startProgram = (
  gl: WebGL2RenderingContext,
  name: string,
  vertexSource: string,
  fragmentSource: string,
  varyings?: string[],
): PendingProgram => {
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) throw new Error(`[Prisma] could not create a shader for ${name}`);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  };
  const vertex = compile(gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) throw new Error(`[Prisma] could not create the program ${name}`);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  if (varyings) gl.transformFeedbackVaryings(program, varyings, gl.INTERLEAVED_ATTRIBS);
  gl.linkProgram(program);
  return { program, vertex, fragment, name };
};

const finishProgram = (gl: WebGL2RenderingContext, pending: PendingProgram) => {
  if (!gl.getProgramParameter(pending.program, gl.LINK_STATUS)) {
    throw new Error(
      `[Prisma] ${pending.name} failed: ${gl.getProgramInfoLog(pending.program)} ` +
        `${gl.getShaderInfoLog(pending.vertex)} ${gl.getShaderInfoLog(pending.fragment)}`,
    );
  }
  gl.deleteShader(pending.vertex);
  gl.deleteShader(pending.fragment);
  return pending.program;
};

/** Starts compiling all three programs; `poll` says when they can be used without blocking. */
export const startPrismaPrograms = (gl: WebGL2RenderingContext) => {
  const parallel = Boolean(gl.getExtension("KHR_parallel_shader_compile"));
  const pending = [
    startProgram(gl, "path", SHARD_PATH_VERTEX, EMPTY_FRAGMENT, PATH_VARYINGS),
    startProgram(gl, "shard", SHARD_VERTEX, SHARD_FRAGMENT),
    startProgram(gl, "glyph", GLYPH_VERTEX, GLYPH_FRAGMENT),
  ];
  return {
    parallel,
    poll: () =>
      !parallel ||
      pending.every((entry) => gl.getProgramParameter(entry.program, COMPLETION_STATUS_KHR)),
    finish: () =>
      pending.map((entry) => finishProgram(gl, entry)) as [
        WebGLProgram,
        WebGLProgram,
        WebGLProgram,
      ],
  };
};

const locate = (gl: WebGL2RenderingContext, program: WebGLProgram, names: string[]): Uniforms =>
  Object.fromEntries(names.map((name) => [name, gl.getUniformLocation(program, name)]));

/** A unit box as 24 vertices (position, normal) and 36 indices, faces counter-clockwise from outside. */
const buildBox = () => {
  const faces: [number[], number[], number[]][] = [
    [
      [0, 0, 1],
      [1, 0, 0],
      [0, 1, 0],
    ],
    [
      [0, 0, -1],
      [-1, 0, 0],
      [0, 1, 0],
    ],
    [
      [1, 0, 0],
      [0, 0, -1],
      [0, 1, 0],
    ],
    [
      [-1, 0, 0],
      [0, 0, 1],
      [0, 1, 0],
    ],
    [
      [0, 1, 0],
      [1, 0, 0],
      [0, 0, -1],
    ],
    [
      [0, -1, 0],
      [1, 0, 0],
      [0, 0, 1],
    ],
  ];
  const vertices: number[] = [];
  const indices: number[] = [];
  faces.forEach(([normal, u, v], face) => {
    for (const [a, b] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ] as const) {
      for (let axis = 0; axis < 3; axis += 1) {
        vertices.push((at(normal, axis) + a * at(u, axis) + b * at(v, axis)) * 0.5);
      }
      vertices.push(...normal);
    }
    const first = face * 4;
    indices.push(first, first + 1, first + 2, first, first + 2, first + 3);
  });
  return { vertices: new Float32Array(vertices), indices: new Uint16Array(indices) };
};

export interface PrismaGpuBatch {
  count: number;
  from: number;
  to: number;
  fromTile: [number, number];
  toTile: [number, number];
  staticBuffer: WebGLBuffer;
  dynamicBuffer: WebGLBuffer;
  pathVao: WebGLVertexArrayObject;
  drawVao: WebGLVertexArrayObject;
}

export interface PrismaGpuGlyphs {
  count: number;
  buffer: WebGLBuffer;
  vao: WebGLVertexArrayObject;
}

export interface PrismaFrameUniforms {
  time: number;
  burst: number;
  motion: number;
  turn: number;
  fireAt: number;
  cloud: number;
  energy: number;
  flow: number;
  swarm: number;
  bass: number;
  pulse: number;
  treble: number;
  gloss: number;
  music: number;
  glowBase: number;
}

export class PrismaGl {
  readonly gl: WebGL2RenderingContext;
  private readonly build: ReturnType<typeof startPrismaPrograms>;
  private programs: [WebGLProgram, WebGLProgram, WebGLProgram] | null = null;
  private pathUniforms: Uniforms = {};
  private shardUniforms: Uniforms = {};
  private glyphUniforms: Uniforms = {};
  private readonly transformFeedback: WebGLTransformFeedback;
  private readonly boxBuffer: WebGLBuffer;
  private readonly boxIndices: WebGLBuffer;
  private plates: WebGLTexture;
  private readonly plateBoxes: ({ x: number; y: number; width: number; height: number } | null)[] =
    new Array(PRISMA_PLATE_LAYERS).fill(null);
  private width = 1;
  private height = 1;
  deviceWidth = 1;
  deviceHeight = 1;
  private accent: [number, number, number] = [1, 1, 1];
  private glowAlpha = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", PRISMA_CONTEXT_ATTRIBUTES);
    if (!gl) throw new Error("[Prisma] WebGL2 is not available");
    this.gl = gl;
    this.build = startPrismaPrograms(gl);
    const box = buildBox();
    const boxBuffer = gl.createBuffer();
    const boxIndices = gl.createBuffer();
    const transformFeedback = gl.createTransformFeedback();
    const plates = gl.createTexture();
    if (!boxBuffer || !boxIndices || !transformFeedback || !plates) {
      throw new Error("[Prisma] could not allocate GPU objects");
    }
    this.boxBuffer = boxBuffer;
    this.boxIndices = boxIndices;
    this.transformFeedback = transformFeedback;
    this.plates = plates;
    gl.bindBuffer(gl.ARRAY_BUFFER, boxBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, box.vertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, box.indices, gl.STATIC_DRAW);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.cullFace(gl.BACK);
    gl.clearColor(0, 0, 0, 0);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  }

  get isContextLost() {
    return this.gl.isContextLost();
  }

  get adapter() {
    const gl = this.gl;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    return String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
  }

  /** True once the programs can be used; throws when they failed to build. */
  get ready() {
    if (this.programs) return true;
    if (!this.build.poll()) return false;
    const gl = this.gl;
    const programs = this.build.finish();
    const [path, shard, glyph] = programs;
    this.programs = programs;
    this.pathUniforms = locate(gl, path, [
      "u_view",
      "u_time",
      "u_burst",
      "u_motion",
      "u_turn",
      "u_fireAt",
      "u_cloud",
      "u_flow",
      "u_swarm",
      "u_bass",
      "u_fromVoid",
      "u_toVoid",
    ]);
    this.shardUniforms = locate(gl, shard, [
      "u_view",
      "u_time",
      "u_focal",
      "u_pulse",
      "u_fromTile",
      "u_toTile",
      "u_stretch",
      "u_plates",
      "u_fromLayer",
      "u_toLayer",
      "u_accent",
      "u_gloss",
      "u_treble",
    ]);
    this.glyphUniforms = locate(gl, glyph, [
      "u_view",
      "u_time",
      "u_focal",
      "u_pulse",
      "u_pad",
      "u_always",
      "u_music",
      "u_bass",
      "u_energy",
      "u_plates",
      "u_layer",
      "u_accent",
      "u_glow",
      "u_glowBase",
      "u_glowAlpha",
    ]);
    return true;
  }

  setPalette(accent: [number, number, number], additiveGlow: boolean) {
    this.accent = accent;
    this.glowAlpha = additiveGlow ? 0 : 0.8;
  }

  /** Resizes the canvas and the plates. All plate contents are gone afterwards. */
  resize(width: number, height: number, dpr: number) {
    const gl = this.gl;
    this.width = width;
    this.height = height;
    this.deviceWidth = Math.max(1, Math.round(width * dpr));
    this.deviceHeight = Math.max(1, Math.round(height * dpr));
    this.canvas.width = this.deviceWidth;
    this.canvas.height = this.deviceHeight;
    gl.viewport(0, 0, this.deviceWidth, this.deviceHeight);
    // Immutable storage cannot change size, so each size gets a new texture.
    gl.deleteTexture(this.plates);
    const plates = gl.createTexture();
    if (!plates) throw new Error("[Prisma] could not allocate the plates");
    this.plates = plates;
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, plates);
    gl.texStorage3D(
      gl.TEXTURE_2D_ARRAY,
      1,
      gl.RG8,
      this.deviceWidth,
      this.deviceHeight,
      PRISMA_PLATE_LAYERS,
    );
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.plateBoxes.fill(null);
  }

  uploadPlate(layer: number, image: PrismaPlateImage) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.plates);
    const previous = this.plateBoxes[layer];
    if (previous) {
      gl.texSubImage3D(
        gl.TEXTURE_2D_ARRAY,
        0,
        previous.x,
        previous.y,
        layer,
        previous.width,
        previous.height,
        1,
        gl.RG,
        gl.UNSIGNED_BYTE,
        new Uint8Array(previous.width * previous.height * 2),
      );
    }
    gl.texSubImage3D(
      gl.TEXTURE_2D_ARRAY,
      0,
      image.x,
      image.y,
      layer,
      image.width,
      image.height,
      1,
      gl.RG,
      gl.UNSIGNED_BYTE,
      image.pixels,
    );
    this.plateBoxes[layer] = { x: image.x, y: image.y, width: image.width, height: image.height };
  }

  createBatch(data: PrismaBatchData): PrismaGpuBatch {
    const gl = this.gl;
    const staticBuffer = gl.createBuffer();
    const dynamicBuffer = gl.createBuffer();
    const pathVao = gl.createVertexArray();
    const drawVao = gl.createVertexArray();
    if (!staticBuffer || !dynamicBuffer || !pathVao || !drawVao) {
      throw new Error("[Prisma] could not allocate a batch");
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, staticBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data.buffer, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, dynamicBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data.count * DYNAMIC_STRIDE, gl.DYNAMIC_COPY);

    const bindRoute = (divisor: number) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, staticBuffer);
      for (let index = 0; index < 3; index += 1) {
        gl.enableVertexAttribArray(index);
        gl.vertexAttribPointer(index, 4, gl.FLOAT, false, PRISMA_BATCH_STRIDE, index * 16);
        gl.vertexAttribDivisor(index, divisor);
      }
    };
    gl.bindVertexArray(pathVao);
    bindRoute(0);

    gl.bindVertexArray(drawVao);
    bindRoute(1);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 4, gl.UNSIGNED_BYTE, true, PRISMA_BATCH_STRIDE, 48);
    gl.vertexAttribDivisor(3, 1);
    gl.enableVertexAttribArray(4);
    gl.vertexAttribPointer(4, 4, gl.UNSIGNED_BYTE, true, PRISMA_BATCH_STRIDE, 52);
    gl.vertexAttribDivisor(4, 1);
    gl.bindBuffer(gl.ARRAY_BUFFER, dynamicBuffer);
    for (let index = 0; index < 3; index += 1) {
      gl.enableVertexAttribArray(5 + index);
      gl.vertexAttribPointer(5 + index, 4, gl.FLOAT, false, DYNAMIC_STRIDE, index * 16);
      gl.vertexAttribDivisor(5 + index, 1);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.boxBuffer);
    gl.enableVertexAttribArray(8);
    gl.vertexAttribPointer(8, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(9);
    gl.vertexAttribPointer(9, 3, gl.FLOAT, false, 24, 12);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.boxIndices);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return {
      count: data.count,
      from: data.from,
      to: data.to,
      fromTile: data.fromTile,
      toTile: data.toTile,
      staticBuffer,
      dynamicBuffer,
      pathVao,
      drawVao,
    };
  }

  deleteBatch(batch: PrismaGpuBatch) {
    const gl = this.gl;
    gl.deleteBuffer(batch.staticBuffer);
    gl.deleteBuffer(batch.dynamicBuffer);
    gl.deleteVertexArray(batch.pathVao);
    gl.deleteVertexArray(batch.drawVao);
  }

  createGlyphs(
    layout: PrismaLineLayout,
    times: (glyphIndex: number) => [number, number, number, number],
  ): PrismaGpuGlyphs {
    const gl = this.gl;
    const buffer = gl.createBuffer();
    const vao = gl.createVertexArray();
    if (!buffer || !vao) throw new Error("[Prisma] could not allocate glyphs");
    const raw = new ArrayBuffer(layout.glyphs.length * GLYPH_STRIDE);
    const floats = new Float32Array(raw);
    const bytes = new Uint8Array(raw);
    layout.glyphs.forEach((glyph, index) => {
      const offset = (index * GLYPH_STRIDE) / 4;
      const [land, release, sung, sungUntil] = times(glyph.glyphIndex);
      floats[offset] = glyph.x;
      floats[offset + 1] = glyph.y;
      floats[offset + 2] = glyph.width;
      floats[offset + 3] = glyph.height;
      floats[offset + 4] = land;
      // A float attribute cannot hold Infinity safely on every driver.
      floats[offset + 5] = Number.isFinite(release) ? release : 1e7;
      floats[offset + 6] = sung;
      floats[offset + 7] = sungUntil;
      bytes.set([...glyph.color, 255], index * GLYPH_STRIDE + 32);
    });
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, raw, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, GLYPH_STRIDE, 0);
    gl.vertexAttribDivisor(0, 1);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, GLYPH_STRIDE, 16);
    gl.vertexAttribDivisor(1, 1);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, true, GLYPH_STRIDE, 32);
    gl.vertexAttribDivisor(2, 1);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return { count: layout.glyphs.length, buffer, vao };
  }

  deleteGlyphs(glyphs: PrismaGpuGlyphs) {
    this.gl.deleteBuffer(glyphs.buffer);
    this.gl.deleteVertexArray(glyphs.vao);
  }

  beginFrame() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  private get focal() {
    return this.height * 1.6;
  }

  /** Works out where every shard of the batch is this frame. */
  computePaths(batch: PrismaGpuBatch, frame: PrismaFrameUniforms, voids: [boolean, boolean]) {
    const { gl, pathUniforms: u } = this;
    gl.useProgram(this.programs?.[0] ?? null);
    gl.uniform2f(u.u_view ?? null, this.width, this.height);
    gl.uniform1f(u.u_time ?? null, frame.time);
    gl.uniform1f(u.u_burst ?? null, frame.burst);
    gl.uniform1f(u.u_motion ?? null, frame.motion);
    gl.uniform1f(u.u_turn ?? null, frame.turn);
    gl.uniform1f(u.u_fireAt ?? null, frame.fireAt);
    gl.uniform1f(u.u_cloud ?? null, frame.cloud);
    gl.uniform1f(u.u_flow ?? null, frame.flow);
    gl.uniform1f(u.u_swarm ?? null, frame.swarm);
    gl.uniform1f(u.u_bass ?? null, frame.bass);
    gl.uniform1f(u.u_fromVoid ?? null, voids[0] ? 1 : 0);
    gl.uniform1f(u.u_toVoid ?? null, voids[1] ? 1 : 0);
    gl.bindVertexArray(batch.pathVao);
    gl.enable(gl.RASTERIZER_DISCARD);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.transformFeedback);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, batch.dynamicBuffer);
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, batch.count);
    gl.endTransformFeedback();
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    gl.disable(gl.RASTERIZER_DISCARD);
    gl.bindVertexArray(null);
  }

  drawShards(
    batch: PrismaGpuBatch,
    frame: PrismaFrameUniforms,
    fromLayer: number,
    toLayer: number,
  ) {
    const { gl, shardUniforms: u } = this;
    gl.useProgram(this.programs?.[1] ?? null);
    gl.enable(gl.CULL_FACE);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.plates);
    gl.uniform1i(u.u_plates ?? null, 0);
    gl.uniform2f(u.u_view ?? null, this.width, this.height);
    gl.uniform1f(u.u_time ?? null, frame.time);
    gl.uniform1f(u.u_focal ?? null, this.focal);
    gl.uniform1f(u.u_pulse ?? null, frame.pulse);
    gl.uniform2f(u.u_fromTile ?? null, batch.fromTile[0], batch.fromTile[1]);
    gl.uniform2f(u.u_toTile ?? null, batch.toTile[0], batch.toTile[1]);
    gl.uniform1f(u.u_stretch ?? null, 0.7);
    gl.uniform1f(u.u_fromLayer ?? null, fromLayer);
    gl.uniform1f(u.u_toLayer ?? null, toLayer);
    gl.uniform3f(u.u_accent ?? null, this.accent[0], this.accent[1], this.accent[2]);
    gl.uniform1f(u.u_gloss ?? null, frame.gloss);
    gl.uniform1f(u.u_treble ?? null, frame.treble);
    gl.bindVertexArray(batch.drawVao);
    gl.drawElementsInstanced(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0, batch.count);
    gl.bindVertexArray(null);
    gl.disable(gl.CULL_FACE);
  }

  /** Draws glyphs at rest; `always` skips their times and flashes, for the static mode. */
  drawGlyphs(
    glyphs: PrismaGpuGlyphs,
    layer: number,
    frame: PrismaFrameUniforms,
    pad: number,
    glow: boolean,
    always: boolean,
  ) {
    const { gl, glyphUniforms: u } = this;
    gl.useProgram(this.programs?.[2] ?? null);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.plates);
    gl.uniform1i(u.u_plates ?? null, 0);
    gl.uniform2f(u.u_view ?? null, this.width, this.height);
    gl.uniform1f(u.u_time ?? null, frame.time);
    gl.uniform1f(u.u_focal ?? null, this.focal);
    gl.uniform1f(u.u_pulse ?? null, frame.pulse);
    gl.uniform1f(u.u_pad ?? null, glow ? pad : 0);
    gl.uniform1f(u.u_always ?? null, always ? 1 : 0);
    gl.uniform1f(u.u_music ?? null, frame.music);
    gl.uniform1f(u.u_bass ?? null, frame.bass);
    gl.uniform1f(u.u_energy ?? null, frame.energy);
    gl.uniform1f(u.u_layer ?? null, layer);
    gl.uniform3f(u.u_accent ?? null, this.accent[0], this.accent[1], this.accent[2]);
    gl.uniform1f(u.u_glow ?? null, glow ? 1 : 0);
    gl.uniform1f(u.u_glowBase ?? null, frame.glowBase);
    gl.uniform1f(u.u_glowAlpha ?? null, this.glowAlpha);
    gl.bindVertexArray(glyphs.vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, glyphs.count);
    gl.bindVertexArray(null);
  }

  destroy() {
    const gl = this.gl;
    if (this.programs) this.programs.forEach((program) => gl.deleteProgram(program));
    gl.deleteBuffer(this.boxBuffer);
    gl.deleteBuffer(this.boxIndices);
    gl.deleteTransformFeedback(this.transformFeedback);
    gl.deleteTexture(this.plates);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
