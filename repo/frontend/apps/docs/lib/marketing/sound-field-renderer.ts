import {
  SOUND_FIELD_FRAGMENT_SHADER,
  SOUND_FIELD_VERTEX_SHADER,
} from "@/lib/marketing/sound-field-shader";
import type { SoundFieldRenderer } from "@/types/marketing";

const UNIFORM_NAMES = [
  "uResolution",
  "uTime",
  "uPointer",
  "uDrift",
  "uSpotlight",
  "uIntensity",
  "uPalette",
] as const;

type UniformName = (typeof UNIFORM_NAMES)[number];

const compileShader = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  console.error("[sound-field] shader compile failed:", gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  return null;
};

const linkProgram = (gl: WebGL2RenderingContext) => {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, SOUND_FIELD_VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, SOUND_FIELD_FRAGMENT_SHADER);
  if (!vertex || !fragment) return null;

  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  console.error("[sound-field] program link failed:", gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
  return null;
};

/** 用原生 WebGL2 绘制一张全屏三角形；不支持 WebGL2 时返回 null，由调用方降级为纯色底。 */
export function createSoundFieldRenderer(canvas: HTMLCanvasElement): SoundFieldRenderer | null {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    powerPreference: "low-power",
    premultipliedAlpha: false,
    stencil: false,
  });
  if (!gl) return null;

  const program = linkProgram(gl);
  if (!program) return null;

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const vertexArray = gl.createVertexArray();
  gl.bindVertexArray(vertexArray);
  const positionLocation = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  gl.useProgram(program);
  const uniforms = Object.fromEntries(
    UNIFORM_NAMES.map((name) => [name, gl.getUniformLocation(program, name)]),
  ) as Record<UniformName, WebGLUniformLocation | null>;

  return {
    resize(width, height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    },
    render(frame) {
      gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uTime, frame.time);
      gl.uniform2f(uniforms.uPointer, frame.pointer[0], frame.pointer[1]);
      gl.uniform1f(uniforms.uDrift, frame.drift);
      gl.uniform1f(uniforms.uSpotlight, frame.spotlight);
      gl.uniform1f(uniforms.uIntensity, frame.intensity);
      gl.uniform3fv(uniforms.uPalette, frame.palette);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.deleteVertexArray(vertexArray);
      gl.deleteBuffer(buffer);
      // 不主动 loseContext：StrictMode 下同一张 canvas 会被立即重新挂载并复用上下文。
      gl.deleteProgram(program);
    },
  };
}
