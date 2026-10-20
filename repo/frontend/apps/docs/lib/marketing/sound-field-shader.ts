/**
 * 落地页「声场」着色器。
 *
 * 域扭曲的 simplex fbm 铺出丝绸般的色场，色场零值处拉出细亮的光丝；
 * 画面只做缓慢流动，随页面滚动轻轻漂移，指针只带来很小的视差。
 * 进入歌词舞台时再叠上一层自上而下的追光（uSpotlight 控制亮度）。
 */
export const SOUND_FIELD_VERTEX_SHADER = /* glsl */ `#version 300 es
in vec2 aPosition;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const SOUND_FIELD_FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uPointer;
uniform float uDrift;
uniform float uSpotlight;
uniform float uIntensity;
uniform vec3 uPalette[4];

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

// Ashima Arts 2D simplex noise，输出约 -1..1。
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

const mat2 OCTAVE_ROTATION = mat2(0.8, -0.6, 0.6, 0.8);

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * snoise(p);
    p = OCTAVE_ROTATION * p * 1.92 + 11.7;
    amplitude *= 0.46;
  }
  return value;
}

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// 一束从画面上方斜打下来的追光：沿光轴越远越宽、越暗，边缘柔和。
float spotBeam(vec2 uv, vec2 origin, float angle, float spread) {
  vec2 dir = vec2(sin(angle), -cos(angle));
  vec2 rel = uv - origin;
  float along = dot(rel, dir);
  if (along <= 0.0) return 0.0;
  float across = abs(rel.x * dir.y - rel.y * dir.x);
  float radius = 0.018 + along * spread;
  float cone = 1.0 - smoothstep(radius * 0.3, radius, across);
  return cone * exp(-along * 0.5);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / min(uResolution.x, uResolution.y);
  float t = uTime;

  vec2 p = uv * 0.62 + uPointer * 0.04;
  p.y -= uDrift * 0.22;

  float slow = t * 0.045;
  vec2 q = vec2(fbm(p + vec2(0.0, slow)), fbm(p + vec2(5.2, 1.3) - slow));
  vec2 r = vec2(
    fbm(p + 1.05 * q + vec2(1.7, 9.2) + slow * 1.3),
    fbm(p + 1.05 * q + vec2(8.3, 2.8) - slow * 0.9)
  );
  float field = fbm(p + 1.15 * r);

  // 丝绸的褶皱：宽的柔光加上零值处的细亮光丝。
  float folds = sin(field * 3.2 + r.y * 1.8 + t * 0.1);
  float sheen = pow(max(folds, 0.0), 2.0);
  float filament = pow(1.0 - abs(folds), 36.0);

  vec3 base = uPalette[0];
  vec3 deep = uPalette[1];
  vec3 mid = uPalette[2];
  vec3 glow = uPalette[3];

  // 光只在一部分区域聚集，其余沉在暗部，画面才有呼吸感。
  float mass = smoothstep(-0.15, 0.7, field + 0.45 * r.x);
  vec3 color = mix(base, deep, smoothstep(-0.5, 0.5, q.x + q.y) * 0.9);
  color = mix(color, mid, mass * 0.66);
  color = mix(color, glow, smoothstep(0.35, 1.0, sheen * mass) * 0.42);
  color += glow * sheen * mass * 0.14;
  color += glow * filament * mass * 0.07;

  // 舞台式布光：上方稍亮，四周沉入底色。
  float light = smoothstep(1.35, 0.1, length((uv - vec2(0.0, 0.18)) * vec2(0.82, 1.15)));
  color = mix(base, color, light * uIntensity);

  // 舞台追光：三束光从画面上沿外打下来，两侧斜向中间、中间一束直落，
  // 光柱里有缓慢飘动的光尘，落到底部汇成一片光池；亮起时光柱以外的区域压暗。
  if (uSpotlight > 0.001) {
    float halfWidth = 0.5 * uResolution.x / min(uResolution.x, uResolution.y);
    float top = 0.5 * uResolution.y / min(uResolution.x, uResolution.y);
    float beams =
      spotBeam(uv, vec2(-0.62 * halfWidth, top + 0.06), 0.36 + 0.02 * sin(t * 0.13), 0.19) +
      spotBeam(uv, vec2(0.0, top + 0.12), 0.015 * sin(t * 0.11 + 1.3), 0.16) * 1.1 +
      spotBeam(uv, vec2(0.62 * halfWidth, top + 0.06), -0.36 + 0.02 * sin(t * 0.12 + 2.1), 0.19);
    float dust = 0.6 + 0.4 * fbm(uv * vec2(2.4, 1.3) + vec2(0.0, t * 0.035));
    vec2 poolOffset = (uv - vec2(0.0, -top + 0.1)) * vec2(0.8, 3.0);
    float pool = exp(-dot(poolOffset, poolOffset) * 2.4);
    float lightMask = beams * dust + pool * 0.55;
    vec3 lightColor = mix(vec3(1.0, 0.95, 0.88), glow, 0.3);
    color *= mix(1.0, 0.32 + min(lightMask, 1.2) * 0.85, uSpotlight * 0.9);
    color += lightColor * lightMask * 0.2 * uSpotlight;
  }

  // 轻度色调压缩并加入亚像素抖动，避免暗部渐变出现色带。
  color = color / (1.0 + color * 0.28);
  color += (hash(gl_FragCoord.xy + fract(t) * 91.7) - 0.5) * (2.5 / 255.0);

  fragColor = vec4(color, 1.0);
}
`;
