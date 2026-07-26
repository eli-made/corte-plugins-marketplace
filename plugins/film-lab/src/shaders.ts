/**
 * The GLSL for every Film Lab look, kept out of the manifest so the grades read
 * as shader code rather than as string soup inside a data structure.
 *
 * All ten share one host contract: the vertex stage hands the fragment shader a
 * `vUV` varying (note the caps) and binds the source frame to `uTex`. The host
 * can only bind FLOAT uniforms, and only the ones named in the manifest's
 * `uniforms` map — so every knob below is a float, and there is no time or
 * resolution uniform to reach for. Sizes are therefore expressed in fractions
 * of the frame, and anything that would normally animate is frame-stable.
 *
 * Each look ends by `mix()`ing back toward the source by `uAmount`, so the
 * default parameter values land on a usable grade instead of a maxed-out one.
 *
 * The GLSL below is deliberately plain ASCII, comments included: WebGL restricts
 * shader source to the GLSL ES character set, and a stray typographic dash in a
 * comment is enough for a driver to reject the whole program.
 */

const HEAD = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 fragColor;
uniform sampler2D uTex;
`

/** Rec.709 luminance. Most of these grades weight their pull by it so the look
 *  lands on tonality rather than flatly tinting the whole frame. */
const LUMA = `
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
`

/** Gentle filmic S-curve, shared by several looks. k around 0.5 is subtle,
 *  above 1.0 is punchy; it pivots on middle grey so exposure holds. */
const SCURVE = `
vec3 scurve(vec3 x, float k) { return clamp(x + k * (x - 0.5) * x * (1.0 - x), 0.0, 1.0); }
`

export const TEAL_ORANGE_FS = `${HEAD}${LUMA}${SCURVE}
uniform float uAmount;
uniform float uSplit;
void main() {
  vec4 src = texture(uTex, vUV);
  float l = luma(src.rgb);
  // S-curve first, then a teal push masked to shadows and an orange push
  // masked to highlights, then a saturation lift. uSplit slides both masks so
  // the handoff can chase skin tones instead of cutting through them.
  float shadows = clamp(1.0 - l * (1.1 / uSplit), 0.0, 1.0);
  float highs = clamp(2.0 * l - 2.8 * uSplit + 0.7, 0.0, 1.0);
  vec3 graded = scurve(src.rgb, 0.6);
  graded += shadows * vec3(-0.04, 0.02, 0.06) + highs * vec3(0.06, 0.02, -0.05);
  graded = mix(vec3(luma(graded)), graded, 1.18);
  fragColor = vec4(clamp(mix(src.rgb, graded, uAmount), 0.0, 1.0), src.a);
}`

export const BLEACH_BYPASS_FS = `${HEAD}${LUMA}${SCURVE}
uniform float uAmount;
uniform float uContrast;
void main() {
  vec4 src = texture(uTex, vUV);
  // Silver retention drains most of the colour and hardens the tone curve;
  // the small lift at the end keeps the look gritty rather than muddy.
  vec3 drained = mix(vec3(luma(src.rgb)), src.rgb, 0.35);
  vec3 graded = scurve(drained, uContrast * 0.7) * 1.04;
  fragColor = vec4(clamp(mix(src.rgb, graded, uAmount), 0.0, 1.0), src.a);
}`

export const HALATION_FS = `${HEAD}
uniform float uAmount;
uniform float uThreshold;
uniform float uRadius;
const vec2 kTaps[8] = vec2[8](
  vec2( 1.000,  0.000), vec2(-1.000,  0.000), vec2( 0.000,  1.000), vec2( 0.000, -1.000),
  vec2( 0.707,  0.707), vec2(-0.707,  0.707), vec2( 0.707, -0.707), vec2(-0.707, -0.707)
);
// Expand highlights the way Reinhard compressed them, so near-clipped pixels
// carry real energy into the halo instead of flat 1.0s.
vec3 detone(vec3 c) {
  vec3 lin = pow(c, vec3(2.2));
  return lin / (1.0 - 0.6 * min(lin, vec3(0.9)));
}
void main() {
  vec4 src = texture(uTex, vUV);
  // Radius is a percentage of the frame, not pixels: there is no resolution
  // uniform available, and UV-space offsets keep the halo scale-independent.
  float r = uRadius * 0.01;
  vec3 bloom = vec3(0.0);
  for (int i = 0; i < 8; i++) {
    // Two rings stand in for a wide gaussian: a tight bright core and a
    // faint wide skirt. Only near-clipped light feeds either.
    bloom += max(detone(texture(uTex, vUV + kTaps[i] * r).rgb) - uThreshold, 0.0) * 0.62;
    bloom += max(detone(texture(uTex, vUV + kTaps[i] * r * 2.2).rgb) - uThreshold, 0.0) * 0.38;
  }
  bloom /= 8.0;
  // Neutral glow in linear light, tone-mapped back: it reads as an expensive
  // lens rather than as an effect layer.
  vec3 outLin = pow(src.rgb, vec3(2.2)) + bloom * uAmount * 1.6;
  vec3 mapped = pow(max(outLin / (1.0 + 0.12 * outLin), 0.0), vec3(1.0 / 2.2));
  fragColor = vec4(clamp(mapped, 0.0, 1.0), src.a);
}`

export const VHS_WEAR_FS = `${HEAD}
uniform float uAmount;
uniform float uScanlines;
uniform float uShift;
void main() {
  vec4 src = texture(uTex, vUV);
  // Tape carries chroma on a separate, lower-bandwidth subcarrier, so red and
  // blue drift away from green rather than travelling with it.
  float sh = uShift * 0.002;
  float r = texture(uTex, vUV + vec2(sh, 0.0)).r;
  float b = texture(uTex, vUV - vec2(sh, 0.0)).b;
  vec3 worn = vec3(r, src.g, b);
  // Scanlines key off vUV alone so they stay locked to the frame; with no time
  // uniform to drive them, a moving rolling bar is not available.
  float scan = 0.5 + 0.5 * sin(vUV.y * uScanlines * 3.14159265);
  worn *= 1.0 - 0.3 * scan;
  fragColor = vec4(clamp(mix(src.rgb, worn, uAmount), 0.0, 1.0), src.a);
}`

export const DAY_FOR_NIGHT_FS = `${HEAD}${LUMA}
uniform float uAmount;
uniform float uExposure;
void main() {
  vec4 src = texture(uTex, vUV);
  vec3 night = src.rgb * uExposure;
  // Human vision is nearly colour-blind at low light: crush most of the chroma,
  // then cast what survives toward moonlight blue.
  night = mix(vec3(luma(night)), night, 0.35) * vec3(0.72, 0.85, 1.25);
  fragColor = vec4(clamp(mix(src.rgb, night, uAmount), 0.0, 1.0), src.a);
}`

export const GRAIN_FS = `${HEAD}${LUMA}
uniform float uAmount;
uniform float uSize;
// Value hash: deterministic per-pixel noise with no texture lookup. The host
// binds no time uniform, so this grain is static by design: it reads as
// scanned emulsion rather than as television snow.
float hash(vec2 p) {
  p = fract(p * vec2(443.8975, 397.2973));
  p += dot(p, p.yx + 19.19);
  return fract((p.x + p.y) * p.x);
}
void main() {
  vec4 src = texture(uTex, vUV);
  // uSize is grain diameter: coarsening the sample grid by it is what produces
  // clumps instead of single-pixel speckle.
  float n = hash(floor(vUV * 2048.0 / max(uSize, 0.5))) - 0.5;
  // Emulsion grain peaks in the midtones and vanishes in clipped blacks and
  // whites, so weight it with a luminance bell.
  float l = luma(src.rgb);
  fragColor = vec4(clamp(src.rgb + n * uAmount * 4.0 * l * (1.0 - l), 0.0, 1.0), src.a);
}`

export const CROSS_PROCESS_FS = `${HEAD}${LUMA}${SCURVE}
uniform float uAmount;
uniform float uSaturation;
void main() {
  vec4 src = texture(uTex, vUV);
  float l = luma(src.rgb);
  // Print chemistry pushes the record apart by tone: shadows drift green,
  // highlights drift toward pink and cyan, and the curve snaps in between.
  float shadows = clamp(1.0 - 2.2 * l, 0.0, 1.0);
  float highs = clamp(2.0 * l - 0.7, 0.0, 1.0);
  vec3 c = src.rgb + shadows * vec3(-0.02, 0.05, -0.02) + highs * vec3(0.05, -0.01, 0.06);
  c = scurve(c, 0.5);
  c = mix(vec3(luma(c)), c, uSaturation * 0.9);
  fragColor = vec4(clamp(mix(src.rgb, c, uAmount), 0.0, 1.0), src.a);
}`

export const FADED_MATTE_FS = `${HEAD}${LUMA}
uniform float uAmount;
uniform float uLift;
uniform float uFade;
void main() {
  vec4 src = texture(uTex, vUV);
  // Remap the full range into a narrower window: milky blacks and no true
  // white, an aged print seen through its own haze.
  vec3 faded = mix(vec3(uLift), vec3(1.0 - uLift * 0.5), src.rgb);
  faded = mix(faded, vec3(luma(faded)), uFade);
  fragColor = vec4(clamp(mix(src.rgb, faded, uAmount), 0.0, 1.0), src.a);
}`

export const COOL_NOIR_FS = `${HEAD}${LUMA}${SCURVE}
uniform float uAmount;
uniform float uContrast;
void main() {
  vec4 src = texture(uTex, vUV);
  // Neutral silver print with a hard S-curve and a slight lift, then the
  // vignette that noir cinematography never actually shipped without.
  vec3 noir = scurve(vec3(luma(src.rgb)), uContrast * 0.65) * 1.06;
  float ring = length((vUV - 0.5) * vec2(2.1, 2.0));
  noir *= 1.0 - 0.35 * pow(clamp(ring - 0.45, 0.0, 1.0), 1.5);
  fragColor = vec4(clamp(mix(src.rgb, noir, uAmount), 0.0, 1.0), src.a);
}`

export const GOLDEN_HOUR_FS = `${HEAD}${LUMA}
uniform float uAmount;
uniform float uWarmth;
uniform float uGlow;
void main() {
  vec4 src = texture(uTex, vUV);
  float l = luma(src.rgb);
  // Low sun warms what it lights, not the shadows it misses; weighting the
  // push by luminance keeps this from flattening into an orange wash.
  vec3 warm = src.rgb + vec3(0.18, 0.07, -0.10) * uWarmth * l;
  // A little highlight haze stands in for sun flaring through the lens.
  warm += vec3(1.0, 0.85, 0.6) * max(l - 0.75, 0.0) * uGlow;
  fragColor = vec4(clamp(mix(src.rgb, warm, uAmount), 0.0, 1.0), src.a);
}`

export const DUOTONE_FS = `${HEAD}${LUMA}
uniform float uAmount;
uniform float uHue;
uniform float uSplit;
// Compact HSV to RGB; hue is the only thing that varies at runtime.
vec3 hsv2rgb(vec3 c) {
  vec3 p = abs(fract(c.xxx + vec3(1.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
  return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}
void main() {
  vec4 src = texture(uTex, vUV);
  float l = luma(src.rgb);
  // Two inks, like a screen print: a deep tone at uHue and a paper tone at
  // its complement. The split is the luminance where one ink hands the frame
  // to the other, which is what keeps faces readable instead of silhouetted.
  vec3 ink = hsv2rgb(vec3(uHue, 0.55, 0.22));
  vec3 paper = hsv2rgb(vec3(fract(uHue + 0.5), 0.18, 0.96));
  vec3 duo = mix(ink, paper, smoothstep(uSplit - 0.5, uSplit + 0.5, l));
  fragColor = vec4(clamp(mix(src.rgb, duo, uAmount), 0.0, 1.0), src.a);
}`

export const CINEMATIC_FS = `${HEAD}${LUMA}${SCURVE}
uniform float uAmount;
uniform float uBars;
uniform float uVignette;
void main() {
  vec4 src = texture(uTex, vUV);
  float l = luma(src.rgb);
  // The one-tap version of a graded master: the Teal and Orange grade, a
  // corner falloff and letterbox bars in a single pass. Stack Film Grain over
  // it when the frame should read as print rather than sensor.
  float shadows = clamp(1.0 - 2.2 * l, 0.0, 1.0);
  float highs = clamp(2.0 * l - 0.7, 0.0, 1.0);
  vec3 graded = scurve(src.rgb, 0.6);
  graded += shadows * vec3(-0.04, 0.02, 0.06) + highs * vec3(0.06, 0.02, -0.05);
  graded = mix(vec3(luma(graded)), graded, 1.18);
  float ring = length((vUV - 0.5) * vec2(2.1, 2.0));
  graded *= 1.0 - uVignette * pow(clamp(ring - 0.45, 0.0, 1.0), 1.5);
  vec3 outc = clamp(mix(src.rgb, graded, uAmount), 0.0, 1.0);
  // Bars sit outside the Amount blend: they are geometry, not grade. Height
  // is a fraction of the frame, the same convention the other looks use for
  // size in the absence of a resolution uniform.
  if (vUV.y < uBars || vUV.y > 1.0 - uBars) outc = vec3(0.0);
  fragColor = vec4(outc, src.a);
}`

export const VIBRANCE_FS = `${HEAD}${LUMA}${SCURVE}
uniform float uAmount;
uniform float uVibrance;
uniform float uContrast;
void main() {
  vec4 src = texture(uTex, vUV);
  vec3 c = src.rgb;
  // Vibrance, not saturation: the push scales inversely with how saturated a
  // pixel already is, so dull walls wake up while skin stays skin.
  float satNow = max(max(c.r, c.g), c.b) - min(min(c.r, c.g), c.b);
  vec3 gray = vec3(luma(c));
  vec3 vivid = mix(gray, c, 1.0 + uVibrance * (1.0 - clamp(satNow * 4.0, 0.0, 1.0)));
  vivid = scurve(vivid, uContrast);
  fragColor = vec4(clamp(mix(src.rgb, vivid, uAmount), 0.0, 1.0), src.a);
}`
