#version 300 es
// Adapted from "Hex Glitch" by igneus (https://www.shadertoy.com/view/lfscD7).
// CC BY-NC-SA 3.0. See NOTICE.md in this directory for the changes.
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform vec3 uPaper;
uniform float uBloomGain;
uniform float uVignette;
uniform float uAspect;
uniform float uLyricBand;

void main() {
  vec3 color = texture(uScene, vUv).rgb;
  // Glow is the blurred difference from the page colour: it lifts a dark page and shades a light one.
  if (uBloomGain > 0.0) color += (texture(uBloom, vUv).rgb - uPaper) * uBloomGain;
  // Where lyrics usually sit the image softens toward its own blur and the page, so it never fights the text.
  float band = smoothstep(0.2, 0.36, vUv.y) * (1.0 - smoothstep(0.64, 0.8, vUv.y));
  vec3 soft = uBloomGain > 0.0 ? texture(uBloom, vUv).rgb : uPaper;
  color = mix(color, mix(soft, uPaper, 0.35), band * uLyricBand);
  vec2 centred = (vUv - 0.5) * vec2(uAspect, 1.0) * 2.0;
  float falloff = pow(length(centred) * 0.6 / 1.41421356, 3.0);
  color *= 1.0 - uVignette * clamp(falloff, 0.0, 1.0);
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
