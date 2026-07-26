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

export const TEAL_ORANGE_FS = `${HEAD}${LUMA}
uniform float uAmount;
uniform float uSplit;
void main() {
  vec4 src = texture(uTex, vUV);
  float l = luma(src.rgb);
  // Shadows lean teal, highlights lean orange; uSplit is the luminance at which
  // one hands off to the other, which is what moves the look across skin tones.
  float t = smoothstep(uSplit - 0.25, uSplit + 0.25, l);
  vec3 tint = mix(vec3(0.0, 0.55, 0.65), vec3(1.0, 0.62, 0.25), t);
  // Centred on 0.5 so the split-tone shifts hue without lifting exposure.
  vec3 graded = src.rgb + (tint - 0.5) * 0.35;
  fragColor = vec4(clamp(mix(src.rgb, graded, uAmount), 0.0, 1.0), src.a);
}`

export const BLEACH_BYPASS_FS = `${HEAD}${LUMA}
uniform float uAmount;
uniform float uContrast;
void main() {
  vec4 src = texture(uTex, vUV);
  vec3 gray = vec3(luma(src.rgb));
  // Silver retention prints the black-and-white record back over the colour one
  // in hard light, which is why the look blows highlights and blocks shadows.
  vec3 hard = mix(2.0 * src.rgb * gray, 1.0 - 2.0 * (1.0 - src.rgb) * (1.0 - gray), step(0.5, gray.r));
  vec3 graded = (hard - 0.5) * uContrast + 0.5;
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
void main() {
  vec4 src = texture(uTex, vUV);
  // Radius is a percentage of the frame, not pixels: there is no resolution
  // uniform available, and UV-space offsets keep the halo scale-independent.
  float r = uRadius * 0.01;
  vec3 bloom = vec3(0.0);
  for (int i = 0; i < 8; i++) {
    // Only what is already near clipping feeds the halo, so midtones stay sharp.
    bloom += max(texture(uTex, vUV + kTaps[i] * r).rgb - uThreshold, 0.0);
  }
  // The red layer sits deepest in the emulsion and scatters most, so real
  // halation reads warm rather than as a neutral bloom.
  bloom = bloom / 8.0 * vec3(1.0, 0.55, 0.35) * 3.0;
  fragColor = vec4(clamp(src.rgb + bloom * uAmount, 0.0, 1.0), src.a);
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

export const CROSS_PROCESS_FS = `${HEAD}${LUMA}
uniform float uAmount;
uniform float uSaturation;
void main() {
  vec4 src = texture(uTex, vUV);
  vec3 c = clamp(src.rgb, 0.0, 1.0);
  // Running slide film through print chemistry bends each channel differently:
  // reds snap, greens soften, and blue never reaches the floor.
  vec3 curved = vec3(
    smoothstep(0.05, 0.95, c.r),
    pow(c.g, 0.85),
    mix(0.12, 0.92, c.b * c.b)
  );
  curved = mix(vec3(luma(curved)), curved, uSaturation);
  fragColor = vec4(clamp(mix(src.rgb, curved, uAmount), 0.0, 1.0), src.a);
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

export const COOL_NOIR_FS = `${HEAD}${LUMA}
uniform float uAmount;
uniform float uContrast;
void main() {
  vec4 src = texture(uTex, vUV);
  // Not a flat greyscale: printing the luma back with a steel cast keeps skin
  // separated from the background instead of merging into it.
  vec3 noir = vec3(luma(src.rgb)) * vec3(0.88, 0.95, 1.12);
  noir = (noir - 0.5) * uContrast + 0.5;
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
