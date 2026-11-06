#version 300 es
// Adapted from "Hex Glitch" by igneus (https://www.shadertoy.com/view/lfscD7).
// CC BY-NC-SA 3.0. See NOTICE.md in this directory for the changes.
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uScene;
uniform vec2 uRadius;

// Two rings around the centre: one pass into a downsampled target, in place of a separable blur at full size.
void main() {
  vec3 sum = texture(uScene, vUv).rgb * 2.0;
  float total = 2.0;
  for (int index = 0; index < 8; ++index) {
    float angle = float(index) * 0.78539816;
    vec2 direction = vec2(cos(angle), sin(angle)) * uRadius;
    sum += texture(uScene, vUv + direction * 0.5).rgb;
    sum += texture(uScene, vUv + direction).rgb * 0.5;
    total += 1.5;
  }
  fragColor = vec4(sum / total, 1.0);
}
