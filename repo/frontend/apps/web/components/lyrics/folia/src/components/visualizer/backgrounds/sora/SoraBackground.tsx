import React, { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";
import * as twgl from "twgl.js";
import {
  Theme,
  DEFAULT_SORA_BACKGROUND_TUNING,
  type SoraBackgroundTuning,
} from "../../../../types";
import { parseColorChannels } from "../../colorMix";

// src/components/visualizer/backgrounds/sora/SoraBackground.tsx
// SoraBackground component is a shader-based starfield background.

interface SoraBackgroundProps {
  theme: Theme;
  isDaylight: boolean;
  paused?: boolean;
  tuning?: SoraBackgroundTuning;
  audioPower?: MotionValue<number>;
}

const PARTICLE_COUNT = 180;

const VERTEX_SHADER = `
attribute float a_index;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_star_density;
uniform float u_star_size;
uniform float u_star_speed;
uniform float u_twinkle_intensity;
uniform float u_accent_ratio;
uniform float u_audio_sync;
uniform float u_audio_sync_strength;
varying float v_color_type;
varying float v_intensity_base;

float hash2(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  float seed = a_index * 123.456;
  float speed_rand = hash2(vec2(seed, 1.1));
  float size_rand = hash2(vec2(seed, 2.2));
  float y_rand = hash2(vec2(seed, 3.3));
  float x_rand = hash2(vec2(seed, 4.4));
  float blink_rand = hash2(vec2(seed, 5.5));
  float color_type_rand = hash2(vec2(seed, 6.6));

  float aspect = u_resolution.x / u_resolution.y;
  float baseSpeed = 0.008 + speed_rand * 0.024;
  float audioScale = 1.0 + u_audio_sync * u_audio_sync_strength * 2.5;
  float speed = baseSpeed * u_star_speed * audioScale;
  float size = (0.0006 + 0.0032 * pow(size_rand, 3.8)) * u_star_size;

  float y = -0.45 + y_rand * 0.9;

  float margin = 0.05;
  float width = aspect + margin * 2.0;
  float x = fract(x_rand + u_time * speed);
  x = x * width - (aspect * 0.5 + margin);

  float wave = sin(u_time * 0.3 + y_rand * 6.283) * 0.005 * u_star_speed;

  float ndc_x = x / (aspect * 0.5);
  float ndc_y = (y + wave) / 0.5;

  gl_Position = vec4(ndc_x, ndc_y, 0.0, 1.0);

  float pointSize = size * u_resolution.y * 3.5 * (0.5 + 0.6 * u_star_density);
  gl_PointSize = max(1.0, pointSize);

  float blink = (0.3 + 0.7 * sin(u_time * (1.0 + blink_rand * 2.5) + x_rand * 6.283)) * u_twinkle_intensity;
  v_intensity_base = max(0.0, blink);
  v_color_type = color_type_rand;
}
`;

const FRAGMENT_SHADER = `
precision mediump float;
uniform vec3 u_particle_color;
uniform vec3 u_particle_accent_color;
uniform float u_accent_ratio;
uniform float u_star_density;

varying float v_color_type;
varying float v_intensity_base;

void main() {
  vec2 pc = gl_PointCoord - 0.5;
  float dist = length(pc);

  float alpha = smoothstep(0.5, 0.1, dist);
  alpha *= (0.2 + 0.7 * u_star_density);
  alpha *= v_intensity_base;
  if (alpha < 0.01) discard;

  float accentBlend = smoothstep(0.86, 1.0, v_color_type) * 0.55 * u_accent_ratio;
  vec3 baseColor = mix(u_particle_color, u_particle_accent_color, accentBlend);
  gl_FragColor = vec4(baseColor * alpha, alpha);
}
`;

const clampValue = (value: number, min: number, max: number, fallback: number) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;

const clampTuning = (candidate?: SoraBackgroundTuning): SoraBackgroundTuning => {
  const fallback = DEFAULT_SORA_BACKGROUND_TUNING;
  return {
    starDensity: clampValue(candidate?.starDensity, 0.35, 2, fallback.starDensity),
    starSize: clampValue(candidate?.starSize, 0.2, 2.5, fallback.starSize),
    starSpeed: clampValue(candidate?.starSpeed, 0.2, 3, fallback.starSpeed),
    twinkleIntensity: clampValue(candidate?.twinkleIntensity, 0, 1, fallback.twinkleIntensity),
    accentRatio: clampValue(candidate?.accentRatio, 0, 1, fallback.accentRatio),
    audioSyncStrength: clampValue(candidate?.audioSyncStrength, 0, 1, fallback.audioSyncStrength),
    backgroundBrightness: clampValue(
      candidate?.backgroundBrightness,
      0.1,
      1,
      fallback.backgroundBrightness,
    ),
  };
};

const SoraBackground: React.FC<SoraBackgroundProps> = ({
  theme,
  isDaylight,
  paused = false,
  tuning,
  audioPower,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  const resolvedTuning = clampTuning(tuning);
  const tuningRef = useRef<SoraBackgroundTuning>(resolvedTuning);
  tuningRef.current = resolvedTuning;

  const primaryColorChannels =
    parseColorChannels(theme.primaryColor) ||
    (isDaylight ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 });
  const particleColor = [
    primaryColorChannels.r / 255,
    primaryColorChannels.g / 255,
    primaryColorChannels.b / 255,
  ];

  const accentColorChannels = parseColorChannels(theme.accentColor) || primaryColorChannels;
  const particleAccentColor = [
    accentColorChannels.r / 255,
    accentColorChannels.g / 255,
    accentColorChannels.b / 255,
  ];

  const bgColor = isDaylight ? [1.0, 1.0, 1.0] : [0.0, 0.0, 0.0];
  const pausedRef = useRef(paused);
  const particleColorRef = useRef(particleColor);
  const particleAccentColorRef = useRef(particleAccentColor);
  const bgColorRef = useRef(bgColor);

  pausedRef.current = paused;
  particleColorRef.current = particleColor;
  particleAccentColorRef.current = particleAccentColor;
  bgColorRef.current = bgColor;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = twgl.getContext(canvas, { alpha: false, depth: false, antialias: false });
    if (!gl) return;

    const programInfo = twgl.createProgramInfo(gl, [VERTEX_SHADER, FRAGMENT_SHADER], (err) => {
      console.error("SoraBackground twgl program error:", err);
    });
    if (!programInfo) return;

    const indices = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      indices[i] = i;
    }

    const arrays = {
      a_index: { numComponents: 1, data: indices },
    };
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    let lastTimestamp = performance.now();

    const render = (now: number) => {
      if (!pausedRef.current) {
        const delta = (now - lastTimestamp) / 1000;
        timeRef.current += delta;
      }
      lastTimestamp = now;

      twgl.resizeCanvasToDisplaySize(canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      const currentBgColor = bgColorRef.current;
      const bgAlpha = tuningRef.current.backgroundBrightness;
      const finalBgColor = [
        currentBgColor[0] * bgAlpha,
        currentBgColor[1] * bgAlpha,
        currentBgColor[2] * bgAlpha,
      ] as [number, number, number];

      gl.clearColor(finalBgColor[0], finalBgColor[1], finalBgColor[2], 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      const currentTuning = tuningRef.current;
      const currentAudio = audioPower ? Math.min(1, Math.max(0, audioPower.get())) : 0;

      const uniforms = {
        u_resolution: [gl.canvas.width, gl.canvas.height],
        u_time: timeRef.current,
        u_particle_color: particleColorRef.current,
        u_particle_accent_color: particleAccentColorRef.current,
        u_star_density: currentTuning.starDensity,
        u_star_size: currentTuning.starSize,
        u_star_speed: currentTuning.starSpeed,
        u_twinkle_intensity: currentTuning.twinkleIntensity,
        u_accent_ratio: currentTuning.accentRatio,
        u_audio_sync: currentAudio,
        u_audio_sync_strength: currentTuning.audioSyncStrength,
      };

      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, uniforms);

      twgl.drawBufferInfo(gl, bufferInfo, gl.POINTS);

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      gl.deleteProgram(programInfo.program);
      if (bufferInfo.attribs && bufferInfo.attribs.a_index && bufferInfo.attribs.a_index.buffer) {
        gl.deleteBuffer(bufferInfo.attribs.a_index.buffer);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 block size-full"
      style={{
        width: "100%",
        height: "100%",
        willChange: "transform",
        transform: "translateZ(0)",
      }}
    />
  );
};

export default SoraBackground;
