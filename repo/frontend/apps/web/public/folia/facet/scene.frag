#version 300 es
// Adapted from "Hex Glitch" by igneus (https://www.shadertoy.com/view/lfscD7).
// CC BY-NC-SA 3.0. See NOTICE.md in this directory for the changes.
precision highp float;
precision highp int;

in vec2 vUv;
out vec4 fragColor;

uniform vec2 uResolution;
uniform float uFlow;
uniform float uBlend;
uniform float uScale;
uniform float uPresence;
uniform int uTick;
uniform int uFrame;
uniform int uSamples;
uniform int uTurns;
uniform int uRipples;
uniform vec2 uCentres[7];
uniform vec3 uPaper;
uniform vec3 uInk;
uniform vec3 uAccent;
uniform vec3 uSecondary;
uniform float uSeed;
uniform float uThickness;
uniform float uGrain;
uniform vec4 uTear;
uniform float uBurst;
uniform float uHistoryWeight;
uniform float uMaxDelta;
uniform sampler2D uHistory;

const float TWO_PI = 6.28318530718;
const float SHUTTER = 0.025;
const float SHUTTER_DISPLACED = 0.25;
const float BAYER[16] = float[16](0., 8., 2., 10., 12., 4., 14., 6., 3., 11., 1., 9., 15., 7., 13., 5.);

uint pcg(uint value) {
  uint state = value * 747796405u + 2891336453u;
  uint word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
  return (word >> 22u) ^ word;
}
uint hash2(uint a, uint b) { return pcg(a ^ (pcg(b) + 0x9e3779b9u)); }
uint hash3(uint a, uint b, uint c) { return hash2(hash2(a, b), c); }
float unit(uint value) { return float(value) / 4294967295.0; }
float sin01(float value) { return 0.5 + 0.5 * sin(value); }
float cos01(float value) { return 0.5 + 0.5 * cos(value); }
float square(float value) { return value * value; }

// A pointy-top hexagonal lattice with flat sides one unit apart. `axes` are the three signed distances from the
// cell centre, reaching 1 at the cell's edge; `cell` is the lattice index, (0, 0) for the hexagon at the origin.
void hexCell(vec2 point, out vec3 axes, out ivec2 cell) {
  const vec2 size = vec2(1.0, 1.7320508);
  vec4 centres = floor(vec4(point, point - vec2(0.5, 0.8660254)) / size.xyxy) + 0.5;
  vec2 first = point - centres.xy * size;
  vec2 second = point - (centres.zw + 0.5) * size;
  bool useFirst = dot(first, first) < dot(second, second);
  vec2 local = useFirst ? first : second;
  vec2 index = useFirst ? centres.xy : centres.zw + 0.5;
  cell = ivec2(floor(index * 2.0 + 0.5));
  axes = vec3(local.x, dot(local, vec2(-0.5, 0.8660254)), dot(local, vec2(-0.5, -0.8660254))) * 2.0;
}

float widest(vec3 value) { return max(max(abs(value.x), abs(value.y)), abs(value.z)); }

float rippleField(vec2 point, float warped, float exponent) {
  float sum = 0.0;
  float total = 0.0;
  float spacing = float(uTurns) / float(uRipples);
  for (int turn = 0; turn < uTurns; ++turn) {
    float dist = length(point - uCentres[turn]) * 0.5;
    float weight = log2(1.0 / (dist + 1e-4));
    for (int ripple = 0; ripple < uRipples; ++ripple) {
      float offset = (float(turn) + float(ripple) * spacing) / float(uTurns);
      sum += fract(dist - pow(fract(offset + warped), exponent)) * weight;
      total += weight;
    }
  }
  return abs(total) < 1e-3 ? 0.0 : sum / total;
}

// One sample of the scene. `xiTime` spreads the sample over the shutter, which also separates the colour fringes.
vec3 shade(vec2 xy, float xiTime, float xiAb, bool displaced) {
  // The original runs this on a fixed timer. Here the host moves the flow with the music and turns the hexagon on
  // each lyric line, so only the row offset and the shutter are decided per pixel.
  float rowUv = clamp(xy.y / uResolution.y, 0.0, 1.0);
  float warped = uFlow + xiTime * (displaced ? SHUTTER_DISPLACED : SHUTTER) - 0.2 * sqrt(rowUv) - 0.1;
  float phase = fract(warped);
  float morph = 1.0 - smoothstep(0.0, 0.6, sin01(TWO_PI * phase));

  float angle = uBlend * TWO_PI + uSeed * 0.5;
  mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  vec2 view = (xy - 0.5 * uResolution) / uResolution.y * 2.0;
  view /= 1.0 + 0.05 * length(view) * xiAb;
  view = rotation * view / max(uScale, 0.1);

  vec2 warp = view;
  float squash = square(1.0 - morph) * xiTime * clamp(square(0.5 * (1.0 + view.y)), 0.0, 1.0);
  warp.y *= mix(1.0, 0.1, squash);
  float expMorph = pow(morph, 0.3);
  float scale = mix(2.6, 1.1, expMorph);
  float thickness = mix(0.5, 0.4, morph) + uThickness;
  float exponent = mix(0.05, 0.55, morph);
  int invert = 0;
  bool inside = displaced;
  for (int pass = 0; pass < 2; ++pass) {
    vec3 axes;
    ivec2 cell;
    hexCell(warp, axes, cell);
    if (!displaced && cell != ivec2(0)) break;
    if (pass == 0) inside = true;

    // The original re-rolls these cells several times per cycle and shatters them on its kick; a steady pattern
    // that slides keeps the structure without the strobing.
    float slide = TWO_PI * cos01(TWO_PI * phase) * 2.0;
    vec2 shifted = warp * 1.1 - 0.8660254 * vec2(sin(slide), cos(slide)) * sin01(TWO_PI * phase) * 0.5;
    hexCell(shifted, axes, cell);
    uint cellHash = hash2(uint(cell.x + 4096), uint(cell.y + 4096));
    if (cellHash % 2u == 0u) {
      float hashSum = axes[int(cellHash % 3u)] + axes[int((cellHash + 1u) % 3u)];
      if (widest(axes) > 0.98) invert ^= 1;
      else if (fract(20.0 * hashSum) < 0.5) invert ^= 1;
      if (pass == 0) break;
    }

    invert ^= int(rippleField(warp, warped, exponent) > thickness);

    float drift = TWO_PI * cos01(-TWO_PI * phase) * 5.0;
    warp += vec2(cos(drift), sin(drift)) * 0.5;
    warp *= scale;
  }
  // The original flips the whole screen here; keeping the page colour outside leaves the lyrics readable.
  if (!inside) return uPaper;

  // Two tones of ink rather than ink and page: the original's black and white inversion is what flashed.
  float coverage = invert != 0 ? 1.0 : 0.45;
  // Equal parts of both colours cancel out, so flat areas stay ink and only moving edges fringe.
  vec3 fringe = (mix(uAccent, uSecondary, xiTime) - 0.5 * (uAccent + uSecondary)) * 0.5;
  vec3 ink = mix(uInk, uAccent, 0.25) + fringe;
  return mix(uPaper, clamp(ink, 0.0, 1.0), coverage * uPresence);
}

void main() {
  vec2 xy = gl_FragCoord.xy;
  uint frame = uint(uFrame);
  uint tick = uint(uTick);

  // Rows slip sideways like analogue interference; a burst makes more of them slip, further.
  vec2 moved = xy;
  uint rowHash = hash2(uint(xy.y * 720.0 / uResolution.y / 2.0), tick);
  float slipChance = uBurst * 0.5;
  if (unit(rowHash) < slipChance) {
    float magnitude = mix(-1.0, 1.0, unit(pcg(rowHash)));
    moved.x -= uResolution.x * mix(0.01, 0.02, uBurst) * sign(magnitude) * square(magnitude);
  }

  // A tear shows the whole lattice in one band of the screen.
  bool displaced = false;
  float rowUv = xy.y / uResolution.y;
  if (uTear.y > 0.0 && rowUv > uTear.x && rowUv < uTear.x + uTear.y) {
    moved += uTear.zw * uResolution;
    displaced = true;
  }

  uint pixel = hash3(uint(xy.x), uint(xy.y), frame);
  vec3 sum = vec3(0.0);
  for (int index = 0; index < uSamples; ++index) {
    uint sampleHash = hash2(pixel, uint(index));
    float xiTime = (float(index) + unit(sampleHash)) / float(uSamples);
    float xiAb = unit(pcg(sampleHash));
    vec2 jitter = vec2(unit(pcg(sampleHash + 1u)), unit(pcg(sampleHash + 2u)));
    sum += shade(moved + jitter, xiTime, xiAb, displaced);
  }
  vec3 color = sum / float(uSamples);

  if (displaced) {
    int block = 1 + int(hash3(uint(uTick / 8), uint(xy.x) / 128u, uint(xy.y) / 128u) & 7u);
    ivec2 dither = (ivec2(xy) / block) & 3;
    float damage = (BAYER[dither.y * 4 + dither.x] + 0.5) / 16.0;
    vec3 level = color * 5.0;
    level += step(damage, fract(level));
    color = floor(level) / 5.0;
  }

  // Grain sits on the difference from the page colour, so an empty page stays clean.
  float grain = (unit(pixel) - 0.5) * (0.025 + uGrain * 0.02);
  color += grain * smoothstep(0.0, 0.2, distance(color, uPaper));

  vec3 history = texture(uHistory, vUv).rgb;
  vec3 blended = mix(color, history, displaced ? 0.0 : uHistoryWeight);
  // No pixel may change faster than this, however the picture above moves: the limit is what rules out flashing.
  if (uHistoryWeight > 0.0) blended = clamp(blended, history - uMaxDelta, history + uMaxDelta);
  fragColor = vec4(blended, 1.0);
}
