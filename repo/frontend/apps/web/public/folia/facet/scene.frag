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
uniform float uOpen;
uniform float uPresence;
uniform int uTick;
uniform int uFrame;
uniform int uSamples;
uniform int uTurns;
uniform int uRipples;
uniform vec2 uCentres[7];
uniform vec2 uRings[4];
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
uniform float uCoverStrength;
uniform sampler2D uHistory;
uniform sampler2D uCover;
uniform sampler2D uLights;

const float TWO_PI = 6.28318530718;
const float SHUTTER = 0.025;
/** Facets across one unit of the view, where the screen is two units tall. */
const float FACETS_PER_UNIT = 4.0;
const float WINDOW_CLOSED = 0.62;
const float WINDOW_OPEN = 2.1;
const int LIGHT_SLOTS = 128;
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
float square(float value) { return value * value; }

// A pointy-top hexagonal lattice with flat sides one unit apart. `axes` are the three signed distances from the
// cell centre, reaching 1 at the cell's edge; `centre` is where the cell is, with a cell at the origin.
void hexCell(vec2 point, out vec3 axes, out vec2 centre) {
  const vec2 size = vec2(1.0, 1.7320508);
  vec4 centres = floor(vec4(point, point - vec2(0.5, 0.8660254)) / size.xyxy) + 0.5;
  vec2 first = point - centres.xy * size;
  vec2 second = point - (centres.zw + 0.5) * size;
  bool useFirst = dot(first, first) < dot(second, second);
  vec2 local = useFirst ? first : second;
  centre = point - local;
  axes = vec3(local.x, dot(local, vec2(-0.5, 0.8660254)), dot(local, vec2(-0.5, -0.8660254))) * 2.0;
}

float widest(vec3 value) { return max(max(abs(value.x), abs(value.y)), abs(value.z)); }
/** How far out a point is, measured so that a pointy-top hexagon around the origin has a single value on its edge. */
float hexDistance(vec2 point) { return max(abs(point.x), 0.5 * abs(point.x) + 0.8660254 * abs(point.y)); }

// Numbers the lattice in a spiral from the centre, so that the host can light facets outward in the order they're sung.
int spiralRank(int q, int r) {
  int s = -q - r;
  int n = max(max(abs(q), abs(r)), abs(s));
  if (n == 0) return 0;
  int index;
  if (r == -n && q >= 0 && q < n) index = q;
  else if (q == n && r < 0) index = n + r + n;
  else if (s == -n && r >= 0 && q > 0) index = 2 * n + r;
  else if (r == n && q > -n) index = 3 * n - q;
  else if (q == -n && r > 0) index = 4 * n + n - r;
  else index = 5 * n - r;
  return 3 * n * (n - 1) + 1 + index;
}

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

// One sample of the scene. `xiTime` spreads the sample over the shutter, which dissolves the ripple edges into grain.
vec3 shade(vec2 xy, float xiTime, float xiAb, bool displaced) {
  float angle = uBlend * TWO_PI + uSeed * 0.5;
  mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  vec2 view = (xy - 0.5 * uResolution) / uResolution.y * 2.0;
  view /= 1.0 + 0.05 * length(view) * xiAb;
  view = rotation * view / max(uScale, 0.1);

  vec3 axes;
  vec2 centre;
  hexCell(view * FACETS_PER_UNIT, axes, centre);
  vec2 local = view * FACETS_PER_UNIT - centre;
  float edge = smoothstep(0.86, 0.98, widest(axes));
  float reach = hexDistance(centre / FACETS_PER_UNIT);

  // The window opens a facet at a time: each one fades in as the edge reaches it.
  float radius = mix(WINDOW_CLOSED, WINDOW_OPEN, uOpen);
  float inWindow = displaced ? 1.0 : 1.0 - smoothstep(radius - 0.14, radius + 0.14, reach);
  // Outside the window only the structure remains, as faint lines on the page.
  vec3 color = uPaper;
  vec3 pale = mix(uPaper, uInk, 0.09 * uPresence);
  color = mix(color, pale, edge);
  if (inWindow <= 0.003) return color;

  int r = int(round(centre.y / 0.8660254));
  int q = int(round(centre.x - 0.5 * float(r)));
  int rank = spiralRank(q, r);
  float light = rank < LIGHT_SLOTS ? texelFetch(uLights, ivec2(rank, 0), 0).r : 0.0;
  uint facetHash = hash2(uint(q + 4096), uint(r + 4096));

  // Light travels outward a facet at a time, so a beat never moves the geometry.
  float wave = 0.0;
  for (int index = 0; index < 4; ++index) {
    wave += uRings[index].y * exp(-square((reach - uRings[index].x) / 0.2));
  }

  float rowUv = clamp(xy.y / uResolution.y, 0.0, 1.0);
  float warped = uFlow + xiTime * SHUTTER - 0.2 * sqrt(rowUv) - 0.1;
  float phase = fract(warped);
  float morph = 1.0 - smoothstep(0.0, 0.6, sin01(TWO_PI * phase));
  float field = rippleField(view * 1.4, warped, mix(0.05, 0.55, morph));
  float threshold = 0.45 + uThickness;
  float tone = smoothstep(threshold - 0.012, threshold + 0.012, field);

  // Each facet looks at the blurred cover through its own slightly different angle.
  vec2 tilt = (vec2(unit(facetHash), unit(pcg(facetHash))) - 0.5) * 0.2;
  vec2 coverUv = 0.5 + view * 0.34 + tilt + local * 0.09;
  vec3 pane = mix(uAccent, uSecondary, unit(facetHash));
  if (uCoverStrength > 0.0) pane = mix(pane, textureLod(uCover, coverUv, 2.4).rgb, uCoverStrength);
  // Mixing in the theme's ink keeps a pale cover visible on a pale page.
  pane = mix(pane, uInk, 0.28);
  // Equal parts of both colours cancel out, so flat areas stay clean and only the ripple's edges fringe.
  pane += (mix(uAccent, uSecondary, xiTime) - 0.5 * (uAccent + uSecondary)) * 0.14;
  // A little shading across each facet, so they read as tilted glass.
  pane *= 1.0 + dot(local, vec2(0.5, 0.8660254)) * 0.16;

  float opacity = (0.16 + 0.2 * tone) * uPresence + 0.46 * light + 0.13 * wave;
  opacity = clamp(opacity, 0.0, 0.88) * inWindow * (1.0 - edge * 0.55);
  return mix(color, clamp(pane, 0.0, 1.0), opacity);
}

void main() {
  vec2 xy = gl_FragCoord.xy;
  uint frame = uint(uFrame);
  uint tick = uint(uTick);

  // A burst makes rows slip sideways like analogue interference. Only tears cause one.
  vec2 moved = xy;
  uint rowHash = hash2(uint(xy.y * 720.0 / uResolution.y / 2.0), tick);
  if (unit(rowHash) < uBurst * 0.5) {
    float magnitude = mix(-1.0, 1.0, unit(pcg(rowHash)));
    moved.x -= uResolution.x * 0.02 * sign(magnitude) * square(magnitude);
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
