// lib/lyrics/prisma/shaders.ts
// Three programs. SHARD_PATH runs once per shard and only computes where it is, writing the result into a
// buffer through transform feedback: the path is a pure function of the song time, so a pause, a seek or a
// song change needs no simulated state. SHARD draws those shards as thin boxes. GLYPH draws glyphs at rest
// as one quad each, so a line with nothing in flight costs almost nothing.

/** Space is in CSS px, centred on the view, y up and z towards the viewer. */
const SPACE = /* glsl */ `
uniform vec2 u_view;
vec3 toWorld(vec2 css) { return vec3(css.x - u_view.x * .5, u_view.y * .5 - css.y, 0.); }
`;

/** Puts a world position on screen with perspective; nothing is depth tested. */
const PROJECT = /* glsl */ `
uniform float u_focal;
uniform float u_pulse;
vec4 project(vec3 p, float restWeight) {
  p.xy *= 1. + u_pulse * restWeight;
  float z = min(p.z, u_focal * .62);
  return vec4(p.x / (u_view.x * .5), p.y / (u_view.y * .5), 0., (u_focal - z) / u_focal);
}
`;

export const SHARD_PATH_VERTEX = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec4 a_route;
layout(location = 1) in vec4 a_random;
layout(location = 2) in vec4 a_times;

uniform float u_time;
uniform float u_burst;
uniform float u_flow;
uniform float u_swarm;
uniform float u_bass;
uniform float u_motion;
uniform float u_turn;
uniform float u_fireAt;
uniform float u_fromVoid;
uniform float u_toVoid;
${SPACE}
out vec4 v_state;  // position, free
out vec4 v_motion; // velocity, landing
out vec4 v_look;   // flip, hover, alpha, unused

// A divergence-free current built from Arnold-Beltrami-Childress flows: streams that curl without clumping.
vec3 abc(vec3 p, vec3 k) {
  return vec3(k.x * sin(p.z) + k.z * cos(p.y), k.y * sin(p.x) + k.x * cos(p.z), k.z * sin(p.y) + k.y * cos(p.x));
}
vec3 current(vec3 p, float t) {
  vec3 q = p + vec3(t * .31, -t * .23, t * .17);
  vec3 turned = vec3(q.y + q.z * .3, q.z - q.x * .3, q.x + q.y * .2) * 2.3 + 1.7;
  return abc(q, vec3(1., .82, .63)) + .45 * abc(turned, vec3(.7, 1., .85));
}
float ease(float a, float b, float x) {
  float t = clamp((x - a) / (b - a), 0., 1.);
  return t * t * t * (t * (6. * t - 15.) + 10.);
}

void main() {
  vec3 from = toWorld(a_route.xy);
  vec3 to = toWorld(a_route.zw);
  float release = a_times.y;
  float land = a_times.z;
  float t = u_time;
  if (t <= release || t >= land) {
    v_state = vec4(t <= release ? from : to, 0.);
    v_motion = vec4(0., 0., 0., t <= release ? 0. : 1.);
    float alpha = t <= release ? (u_fromVoid > .5 ? 0. : 1.) : (u_toVoid > .5 ? 0. : 1.);
    v_look = vec4(t <= release ? 0. : 1., 0., alpha, 0.);
    return;
  }

  float total = land - release;
  // A glyph with a long wait gets a long flight, so its shards ease in instead of rushing and then waiting.
  float flightTime = min(2.2, total * .72);
  float settleTime = min(.4, total * .45);
  float a = clamp((t - release) / flightTime, 0., 1.);
  float landing = ease(land - settleTime, land, t);
  float unit = u_view.y;
  float scale = unit * .3;

  // The cloud around the target: wide while the glyph is far off and only ever drawing in. The flight heads for
  // this spot rather than the glyph itself, so a shard never reaches the text and is pushed back out again.
  float untilLand = max(land - t, 0.);
  float radius = unit * (.016 + .2 * (1. - exp(-untilLand / 1.4)));
  vec3 drift = current(to / scale + a_random.yzx * 3., t * .5);
  vec3 offset = (normalize(a_random.xyz - .5) + drift * .5) * radius * (1. + .1 * u_bass);
  offset.z *= .6;
  vec3 home = to + offset * (1. - u_toVoid);

  vec3 base = mix(from, home, ease(.12, .92, a));
  // Bursts early, then a long gathering that comes to rest without a jolt.
  float swell = sin(3.14159265 * pow(a, .7));
  float envelope = a >= 1. ? 0. : swell * swell;
  vec3 outward = normalize(vec3(from.xy / unit * .9 + (a_random.xy - .5) * 1.3, .9 + a_random.z));
  float kickAmount = 1. - pow(1. - a, 3.);
  vec3 kick = outward * u_burst * unit * .26 * (.55 + .9 * a_random.w) * kickAmount * (1. + .15 * u_bass);

  // Ride the current in a few steps from the start of the flight, so neighbours form streams.
  vec3 start = base / scale + a_random.xyz * .25;
  vec3 p = start;
  vec3 stream = vec3(0.);
  float stepLength = a * u_flow * .24;
  for (int i = 0; i < 4; i++) {
    stream = current(p, t * .35);
    p += stream * stepLength;
  }

  // How this flight moves through the air. Every shape is gone by the end of the flight, so whichever one plays,
  // the shard arrives at the same place with the same gathering.
  vec3 rel = base - vec3(0., unit * .05, 0.);
  float relLength = length(rel.xy);
  float burst = u_burst * (1. + .15 * u_bass);
  float tame = min(burst, 1.2);
  vec3 shape = envelope * kick;
  vec3 heading = outward * u_burst;
  float streamWeight = 1.;
  float sparkle = 0.;
  if (u_motion > 6.5) {
    // Firework: the line streams up to one point, goes off there on one shared beat, sags and sparkles, and only
    // then lets go, so the gathering is the usual one. The beat is a song time, not a share of each shard's flight.
    vec3 shell = normalize(a_random.xyz - .5 + vec3(.001));
    vec3 point = vec3(u_turn * unit * .16, unit * .17, 0.);
    float launch = ease(release, max(u_fireAt, release + .12), t);
    float blast = clamp((t - u_fireAt) / 1.05, 0., 1.);
    float spread = 1. - (1. - blast) * (1. - blast) * (1. - blast);
    float letGo = 1. - ease(.5, 1., a);
    float room = min(1., total / 1.6);
    vec3 star = shell * unit * (.14 + .36 * a_random.w) * spread * vec3(1.25, 1., 1.);
    star.y -= unit * .2 * blast * blast;
    shape = ((point - base) * launch + star * tame) * letGo * room;
    heading = mix(vec3(0., 1., 0.), shell, blast) * u_burst;
    streamWeight = .12;
    sparkle = blast * letGo;
  } else if (u_motion > 5.5) {
    // Ripple: rings travelling out from the middle.
    vec2 away = rel.xy / (relLength + 1.);
    float ring = relLength / unit * 16. - a * 9. + a_random.x * .6;
    shape = vec3(away * (sin(ring) * .085 + .05), cos(ring) * .1 * (a_random.w - .5) * 2.) * unit * envelope * burst;
    heading = vec3(away, 0.) * u_burst;
    streamWeight = .25;
  } else if (u_motion > 4.5) {
    // Core: everything falls into the middle, then blooms back out.
    vec3 shell = normalize(a_random.xyz - .5 + vec3(.001));
    shape = (shell * unit * .09 - rel * .86) * envelope * tame;
    heading = normalize(vec3(rel.xy, 0.) + vec3(.001)) * mix(-1., 1., ease(.3, .45, a)) * u_burst;
    streamWeight = .2;
  } else if (u_motion > 3.5) {
    // Ribbon: the line is drawn into one flowing band, then unfurls.
    float wave = base.x / unit * 5.2 + t * 1.3 + u_turn;
    float bandY = sin(wave) * unit * .16 + (a_random.y - .5) * unit * .05;
    shape = vec3((a_random.x - .5) * unit * .06, bandY - rel.y, sin(wave * .6) * unit * .12) * envelope * tame;
    heading = vec3(u_turn, cos(wave) * .6, 0.) * u_burst;
    streamWeight = .15;
  } else if (u_motion > 2.5) {
    // Drift: embers rising, or petals falling.
    shape = vec3(sin(a_random.x * 6.283 + a * 4.) * .07, u_turn * (.16 + .34 * a_random.w), .1 * a_random.z) * unit * envelope * burst;
    heading = vec3(0., u_turn, .2) * u_burst;
    streamWeight = .6;
  } else if (u_motion > 1.5) {
    // Gust: blown off to one side in a wave.
    vec3 wind = normalize(vec3(u_turn, .35, .25));
    float wave = sin(base.x / unit * 7. + t * 1.6 + a_random.x * 1.5) * .07;
    shape = (wind * .4 * (.55 + .9 * a_random.w) + vec3(0., wave, 0.)) * unit * envelope * burst * kickAmount;
    heading = wind * u_burst;
    streamWeight = .5;
  } else if (u_motion > .5) {
    // Whirl: one full turn around the middle, as an ellipse so a long line stays on screen.
    float turn = u_turn * 6.28318 * (1. - pow(1. - a, 2.6)) * ease(0., .2, a);
    float cosine = cos(turn);
    float sine = sin(turn);
    vec2 wide = rel.xy * vec2(1., 1.6);
    vec2 turned = vec2(wide.x * cosine - wide.y * sine, wide.x * sine + wide.y * cosine) * vec2(1., .625);
    float reach = min(1., flightTime / .9) * min(burst, 1.);
    shape = vec3((turned - rel.xy) * reach, unit * .12 * a_random.w * envelope * burst) + rel * .18 * envelope * burst;
    heading = normalize(vec3(-rel.y, rel.x, 0.) + vec3(.001)) * u_turn * u_burst;
    streamWeight = .35;
  }
  vec3 free = base + shape + envelope * streamWeight * (p - start) * scale;

  float hover = ease(.55, 1., a) * (1. - landing) * (1. - u_toVoid);
  vec3 position = mix(free, to, landing);

  float nearness = 1. - ease(0., 3., untilLand);
  float hoverAlpha = (.14 + .66 * nearness) * u_swarm;
  float alpha = mix(1., hoverAlpha, hover * (1. - landing));
  alpha *= mix(1., ease(0., .5, a), u_fromVoid);
  alpha *= 1. - u_toVoid * ease(.3, .95, a);
  alpha *= 1. - sparkle * (.5 + .5 * sin(t * 19. + a_random.y * 40.)) * .55;

  vec3 velocity = stream * u_flow * .5 * streamWeight + (to - from) / unit * .8 * (1. - a) +
    heading * (1. - a) * (1. - a) * 1.5;

  float freeWeight = ease(0., .07, a) * (1. - ease(.5, .82, a));
  v_state = vec4(position, freeWeight);
  v_motion = vec4(velocity, landing);
  v_look = vec4(ease(.2, .8, a), hover, alpha, 0.);
}
`;

export const EMPTY_FRAGMENT = /* glsl */ `#version 300 es
precision lowp float;
void main() {}
`;

export const SHARD_VERTEX = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec4 a_route;
layout(location = 1) in vec4 a_random;
layout(location = 2) in vec4 a_times;
layout(location = 3) in vec4 a_fromColor;
layout(location = 4) in vec4 a_toColor;
layout(location = 5) in vec4 a_state;
layout(location = 6) in vec4 a_motion;
layout(location = 7) in vec4 a_look;
layout(location = 8) in vec3 a_box;
layout(location = 9) in vec3 a_normal;

uniform float u_time;
uniform vec2 u_fromTile;
uniform vec2 u_toTile;
uniform float u_stretch;
${SPACE}
${PROJECT}
out vec2 v_uv;
flat out vec3 v_normal;
flat out float v_face;
flat out vec3 v_color;
flat out float v_alpha;
flat out float v_free;
flat out float v_hover;

vec4 mulQuat(vec4 a, vec4 b) {
  return vec4(a.w * b.xyz + b.w * a.xyz + cross(a.xyz, b.xyz), a.w * b.w - dot(a.xyz, b.xyz));
}
vec3 rotate(vec4 q, vec3 v) { return v + 2. * cross(q.xyz, cross(q.xyz, v) + q.w * v); }
vec4 aroundAxis(vec3 axis, float angle) { return vec4(axis * sin(angle * .5), cos(angle * .5)); }

void main() {
  bool shown = u_time >= a_times.x && u_time < a_times.w && a_look.z > .003;
  if (!shown) {
    gl_Position = vec4(2., 2., 2., 1.);
    return;
  }
  float free = a_state.w;
  float landing = a_motion.w;
  float flip = a_look.x;
  float hover = a_look.y;
  float unsettled = hover * (1. - landing);

  // Settled orientation: a half turn about y brings the back face (the next line) to the front.
  vec4 settled = aroundAxis(vec3(0., 1., 0.), -3.14159265 * flip);
  if (unsettled > .001) {
    float wobble = sin(u_time * (1. + a_random.x * 1.6) + a_random.y * 6.283) * .9 * unsettled;
    vec3 axis = normalize(a_random.xyz - .5 + vec3(.001));
    settled = mulQuat(aroundAxis(axis, wobble), settled);
  }
  // In flight the shard points along its velocity, with its own roll.
  float speed = length(a_motion.xyz);
  vec3 forward = speed > .0001 ? a_motion.xyz / speed : vec3(1., 0., 0.);
  vec4 stream = forward.x < -.999
    ? vec4(0., 0., 1., 0.)
    : normalize(vec4(0., -forward.z, forward.y, 1. + forward.x));
  stream = mulQuat(stream, aroundAxis(vec3(1., 0., 0.), (a_random.z - .5) * 3.));
  vec4 q = normalize(mix(settled, dot(settled, stream) < 0. ? -stream : stream, free));

  vec2 tile = mix(u_fromTile, u_toTile, flip);
  float size = (1. - .12 * free) * (1. - .22 * unsettled);
  float depth = min(tile.x, tile.y) * 1.6 * max(free, unsettled);
  vec3 dims = vec3(tile.x * size * (1. + u_stretch * min(speed, 3.) * free), tile.y * size, depth);
  vec3 world = a_state.xyz + rotate(q, a_box * dims);
  vec3 normal = rotate(q, a_normal);

  float face = a_normal.z > .5 ? 1. : a_normal.z < -.5 ? -1. : 0.;
  v_uv = face < 0.
    ? (a_route.zw + vec2(-a_box.x, -a_box.y) * u_toTile) / u_view
    : (a_route.xy + vec2(a_box.x, -a_box.y) * u_fromTile) / u_view;
  v_face = face;
  v_normal = normal;
  v_color = face > 0. ? a_fromColor.rgb : face < 0. ? a_toColor.rgb : mix(a_fromColor.rgb, a_toColor.rgb, flip);
  v_alpha = a_look.z;
  v_free = free;
  v_hover = unsettled;
  gl_Position = project(world, 1. - max(free, unsettled));
}
`;

export const SHARD_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
precision highp sampler2DArray;
in vec2 v_uv;
flat in vec3 v_normal;
flat in float v_face;
flat in vec3 v_color;
flat in float v_alpha;
flat in float v_free;
flat in float v_hover;
uniform sampler2DArray u_plates;
uniform float u_fromLayer;
uniform float u_toLayer;
uniform vec3 u_accent;
uniform float u_gloss;
uniform float u_treble;
out vec4 color;

void main() {
  float shade = max(v_free, v_hover);
  float ink = 1.;
  if (v_face > .5) ink = u_fromLayer < 0. ? 1. : texture(u_plates, vec3(v_uv, u_fromLayer)).r;
  else if (v_face < -.5) ink = u_toLayer < 0. ? 1. : texture(u_plates, vec3(v_uv, u_toLayer)).r;
  else ink = shade;
  // A piece reads as its slice of the glyph at rest and as a solid sliver in the air.
  float solid = min(1., v_free * .8 + v_hover * .3);
  float alpha = mix(ink, 1., abs(v_face) > .5 ? solid : 0.) * v_alpha;
  if (alpha < .004) discard;

  vec3 base = v_color * (abs(v_face) > .5 ? 1. : .55);
  base = mix(base, u_accent, v_free * .32);
  vec3 n = normalize(v_normal);
  vec3 light = normalize(vec3(-.4, .6, .75));
  float diffuse = max(dot(n, light), 0.);
  float highlight = pow(max(dot(n, normalize(light + vec3(0., 0., 1.))), 0.), 36.);
  float rim = pow(1. - max(n.z, 0.), 3.);
  vec3 lit = base * (.62 + .55 * diffuse) + (highlight * .85 + rim * .16 + u_treble * .22) * u_gloss;
  vec3 final = mix(base, lit, shade);
  color = vec4(final * alpha, alpha);
}
`;

export const GLYPH_VERTEX = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec4 a_rect;
layout(location = 1) in vec4 a_span; // lands, leaves, sung from, sung until
layout(location = 2) in vec4 a_color;

uniform float u_time;
uniform float u_pad;
uniform float u_always;
uniform float u_music;
uniform float u_bass;
${SPACE}
${PROJECT}
out vec2 v_uv;
out vec2 v_local;
flat out vec3 v_color;
flat out float v_flash;
flat out float v_held;
flat out float v_sung;
flat out float v_glint;

void main() {
  bool shown = u_always > .5 || (u_time >= a_span.x && u_time < a_span.y);
  if (!shown) {
    gl_Position = vec4(2., 2., 2., 1.);
    return;
  }
  vec2 corner = vec2(float(gl_VertexID & 1), float((gl_VertexID >> 1) & 1));
  vec2 size = a_rect.zw + u_pad * 2.;
  vec2 css = a_rect.xy - u_pad + corner * size;
  float age = u_time - a_span.z;
  float settled = max(age, 0.);
  float sungUntil = max(a_span.w, a_span.z + .05);
  vec2 middle = a_rect.xy + a_rect.zw * .5;
  float rowSize = a_rect.w;
  float seed = fract(sin(dot(a_rect.xy, vec2(12.9898, 78.233))) * 43758.5453);

  // All of this is zero the moment shards hand a glyph over and the moment they take it back, so the shard and
  // the glyph still match pixel for pixel at both ends.
  float arrived = smoothstep(0., .3, u_time - a_span.x);
  float staying = smoothstep(0., .4, a_span.y - u_time);
  float alive = u_always > .5 ? 0. : arrived * staying;

  // Struck when sung: a damped spring that hops, grows and leans, then keeps ringing a little.
  float ring = exp(-settled * 5.) * sin(settled * 15.) * step(0., age);
  // Held: rises and swells for as long as the note lasts.
  float held = smoothstep(a_span.z, a_span.z + .12, u_time) * (1. - smoothstep(sungUntil, sungUntil + .28, u_time));
  // Afterwards the line never quite stops: a slow swell runs along it, and each glyph sways on its own.
  float swell = sin(u_time * 1.15 - middle.x / rowSize * .75);
  float sway = sin(u_time * (.6 + seed * .5) + seed * 6.283);
  float recent = exp(-settled * 1.1);
  // Takes a breath just before it breaks apart.
  float breath = (1. - staying) * staying * 4. * arrived;

  float music = min(u_music, 1.2);
  float scale = 1. + alive * music * (ring * .13 + held * .055 + u_bass * .05 * recent + breath * .025);
  float lean = alive * (ring * .1 * (seed - .5) * 2. * music + sway * .014);
  vec2 shift = vec2(
    sway * .007,
    swell * .016 - music * (ring * .075 + held * .035 + u_bass * .025 * recent)
  ) * rowSize * alive;

  vec2 reach = (css - middle) * scale;
  float cosine = cos(lean);
  float sine = sin(lean);
  vec2 placed = middle + shift + vec2(reach.x * cosine - reach.y * sine, reach.x * sine + reach.y * cosine);

  v_uv = css / u_view;
  v_local = corner * 2. - 1.;
  v_color = a_color.rgb;
  v_flash = u_always > .5 || age < 0. ? 0. : exp(-age * 3.2);
  v_held = u_always > .5 ? 0. : held;
  v_sung = clamp(age / (sungUntil - a_span.z), 0., 1.);
  v_glint = u_always > .5 || age < 0. ? 3. : age * 4.2 - 1.2;
  gl_Position = project(toWorld(placed), 1.);
}
`;

export const GLYPH_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
precision highp sampler2DArray;
in vec2 v_uv;
in vec2 v_local;
flat in vec3 v_color;
flat in float v_flash;
flat in float v_held;
flat in float v_sung;
flat in float v_glint;
uniform sampler2DArray u_plates;
uniform float u_layer;
uniform vec3 u_accent;
uniform float u_glow;
uniform float u_glowBase;
uniform float u_glowAlpha;
out vec4 color;

void main() {
  vec2 ink = texture(u_plates, vec3(v_uv, u_layer)).rg;
  if (u_glow > .5) {
    // Quads overlap here, so each fades out before its edge and they add up evenly.
    vec2 edge = 1. - v_local * v_local;
    float amount = ink.g * edge.x * edge.y * (u_glowBase + v_flash * 1.25);
    color = vec4(u_accent * amount, amount * u_glowAlpha);
    return;
  }
  if (ink.r < .004) discard;
  // The note fills the glyph from the left while it is held, and one glint crosses it when it is struck.
  float across = v_local.x * .5 + .5;
  float toFill = smoothstep(v_sung - .18, v_sung + .18, across);
  float slanted = v_local.x + v_local.y * .35;
  float glint = exp(-(slanted - v_glint) * (slanted - v_glint) * 9.);
  float tint = max(v_flash * .6, v_held * .42 * (1. - toFill));
  vec3 body = mix(v_color, u_accent, min(1., tint + glint * .55));
  color = vec4(body * ink.r, ink.r);
}
`;
