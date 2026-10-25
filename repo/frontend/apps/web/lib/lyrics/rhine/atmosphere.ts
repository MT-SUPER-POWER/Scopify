import * as THREE from "three";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

// Adapted from Rhine Music Database's final composite (MIT, LBEILC). Runs after
// OutputPass, so the paper colours mix in display space exactly as in the source.
// The light theme only hazes the top and corners; the dark theme also closes the
// bottom and draws a deeper vignette, leaving a lit band through the middle.
const AtmosphereShader = {
  name: "RhineAtmosphereShader",
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    theme: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float theme;
    varying vec2 vUv;
    float rhineSaturate(float value) { return clamp(value, 0.0, 1.0); }
    void main() {
      vec4 source = texture2D(tDiffuse, vUv);
      vec3 rgb = source.rgb;
      vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
      vec3 paper = mix(vec3(232.0, 229.0, 225.0) / 255.0, vec3(17.0, 24.0, 27.0) / 255.0, theme);
      float top = mix(
        0.35 * (1.0 - rhineSaturate(uv.y / 0.38)),
        0.82 * (1.0 - rhineSaturate(uv.y / 0.36)),
        theme
      );
      rgb = mix(rgb, mix(vec3(234.0, 231.0, 226.0) / 255.0, paper, theme), top);
      rgb = mix(rgb, paper, 0.84 * (1.0 - rhineSaturate((1.0 - uv.y) / 0.25)) * theme);
      float lightRadius = length((uv - vec2(0.42, 0.47)) / vec2(0.58, 0.53)) / sqrt(2.0);
      float darkRadius = length((uv - vec2(0.48, 0.48)) / vec2(0.58, 0.53)) / sqrt(2.0);
      float edge = mix(
        0.19 * rhineSaturate((lightRadius - 0.32) / 0.53),
        0.48 * rhineSaturate((darkRadius - 0.42) / 0.48),
        theme
      );
      gl_FragColor = vec4(mix(rgb, paper, edge), source.a);
    }`,
};

export function createAtmospherePass() {
  return new ShaderPass(AtmosphereShader);
}
