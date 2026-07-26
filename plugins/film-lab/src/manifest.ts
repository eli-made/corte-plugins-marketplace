import { defineManifest } from '@corte/plugin-types'
import {
  BLEACH_BYPASS_FS,
  COOL_NOIR_FS,
  CROSS_PROCESS_FS,
  DAY_FOR_NIGHT_FS,
  FADED_MATTE_FS,
  GOLDEN_HOUR_FS,
  GRAIN_FS,
  HALATION_FS,
  TEAL_ORANGE_FS,
  VHS_WEAR_FS,
} from './shaders.ts'

export const manifest = defineManifest({
  version: 1,
  id: 'so.corte.filmlab',
  name: 'Film Lab',
  pluginVersion: '1.0.0',
  description:
    'Ten cinematic looks as real-time shader effects: teal & orange, bleach bypass, halation, VHS wear, day-for-night, film grain, cross-process, faded matte, cool noir and golden hour. Each has one to three sliders and blends back to your original, so the defaults are a starting point rather than a maximum.',
  about: `Film Lab is a grade shelf. Ten looks pulled from the way film actually behaves — silver retention, halation off the red layer, the midtone bell of emulsion grain — built as single-pass shaders that run live on the timeline.

Every look has an Amount slider that mixes it back toward your source, plus one or two knobs that matter for that specific look: where teal hands off to orange, how far tape smears chroma, how big the grain clumps are. Nothing is baked in; drop an effect on a clip, drag, and keyframe it like any built-in.

Looks stack. Golden Hour under Halation gives you a warm flare; Faded Matte under Film Grain gives you a scanned print. They render in the preview and the export the same way, and export stays free and watermark-free as always.

A note on grain: Corte binds no time uniform to plugin shaders, so Film Lab's grain is frame-stable rather than crawling. That is the right call for a print look and the wrong one for TV static — it is a deliberate limit, not an oversight.`,
  iconUrl: 'https://assets.corte.so/plugins/film-lab/icon.png',
  screenshots: [
    'https://assets.corte.so/plugins/film-lab/shelf.png',
    'https://assets.corte.so/plugins/film-lab/teal-orange.png',
    'https://assets.corte.so/plugins/film-lab/halation.png',
  ],
  tags: ['color', 'grading', 'film', 'looks', 'shaders', 'retro'],
  contributions: {
    effects: [
      {
        type: 'so.corte.filmlab.tealOrange',
        displayName: 'Teal & Orange',
        category: 'color',
        params: [
          { key: 'amount', label: 'Amount', min: 0, max: 1, default: 0.6 },
          { key: 'split', label: 'Split Point', min: 0.25, max: 0.75, default: 0.5 },
        ],
        fragmentShader: TEAL_ORANGE_FS,
        uniforms: { uAmount: 'amount', uSplit: 'split' },
      },
      {
        type: 'so.corte.filmlab.bleachBypass',
        displayName: 'Bleach Bypass',
        category: 'color',
        params: [
          { key: 'amount', label: 'Amount', min: 0, max: 1, default: 0.7 },
          { key: 'contrast', label: 'Contrast', min: 0.5, max: 2, default: 1.2 },
        ],
        fragmentShader: BLEACH_BYPASS_FS,
        uniforms: { uAmount: 'amount', uContrast: 'contrast' },
      },
      {
        type: 'so.corte.filmlab.halation',
        displayName: 'Halation Glow',
        category: 'stylize',
        params: [
          { key: 'amount', label: 'Amount', min: 0, max: 1, default: 0.5 },
          { key: 'threshold', label: 'Threshold', min: 0, max: 1, default: 0.7 },
          { key: 'radius', label: 'Radius', min: 0.1, max: 2, default: 0.6, unit: '%' },
        ],
        fragmentShader: HALATION_FS,
        uniforms: { uAmount: 'amount', uThreshold: 'threshold', uRadius: 'radius' },
      },
      {
        type: 'so.corte.filmlab.vhsWear',
        displayName: 'VHS Wear',
        category: 'stylize',
        params: [
          { key: 'amount', label: 'Amount', min: 0, max: 1, default: 0.6 },
          { key: 'scanlines', label: 'Scanlines', min: 100, max: 1200, default: 480 },
          { key: 'shift', label: 'Chroma Shift', min: 0, max: 3, default: 1 },
        ],
        fragmentShader: VHS_WEAR_FS,
        uniforms: { uAmount: 'amount', uScanlines: 'scanlines', uShift: 'shift' },
      },
      {
        type: 'so.corte.filmlab.dayForNight',
        displayName: 'Day for Night',
        category: 'color',
        params: [
          { key: 'amount', label: 'Amount', min: 0, max: 1, default: 0.7 },
          { key: 'exposure', label: 'Exposure', min: 0.2, max: 1, default: 0.45 },
        ],
        fragmentShader: DAY_FOR_NIGHT_FS,
        uniforms: { uAmount: 'amount', uExposure: 'exposure' },
      },
      {
        type: 'so.corte.filmlab.grain',
        displayName: 'Film Grain',
        category: 'stylize',
        params: [
          { key: 'amount', label: 'Amount', min: 0, max: 1, default: 0.35 },
          { key: 'size', label: 'Grain Size', min: 0.5, max: 8, default: 2 },
        ],
        fragmentShader: GRAIN_FS,
        uniforms: { uAmount: 'amount', uSize: 'size' },
      },
      {
        type: 'so.corte.filmlab.crossProcess',
        displayName: 'Cross Process',
        category: 'color',
        params: [
          { key: 'amount', label: 'Amount', min: 0, max: 1, default: 0.6 },
          { key: 'saturation', label: 'Saturation', min: 0, max: 2, default: 1.25 },
        ],
        fragmentShader: CROSS_PROCESS_FS,
        uniforms: { uAmount: 'amount', uSaturation: 'saturation' },
      },
      {
        type: 'so.corte.filmlab.fadedMatte',
        displayName: 'Faded Matte',
        category: 'color',
        params: [
          { key: 'amount', label: 'Amount', min: 0, max: 1, default: 0.7 },
          { key: 'lift', label: 'Black Lift', min: 0, max: 0.3, default: 0.12 },
          { key: 'fade', label: 'Fade', min: 0, max: 1, default: 0.35 },
        ],
        fragmentShader: FADED_MATTE_FS,
        uniforms: { uAmount: 'amount', uLift: 'lift', uFade: 'fade' },
      },
      {
        type: 'so.corte.filmlab.coolNoir',
        displayName: 'Cool Noir',
        category: 'color',
        params: [
          { key: 'amount', label: 'Amount', min: 0, max: 1, default: 0.8 },
          { key: 'contrast', label: 'Contrast', min: 0.5, max: 2.5, default: 1.35 },
        ],
        fragmentShader: COOL_NOIR_FS,
        uniforms: { uAmount: 'amount', uContrast: 'contrast' },
      },
      {
        type: 'so.corte.filmlab.goldenHour',
        displayName: 'Golden Hour',
        category: 'color',
        params: [
          { key: 'amount', label: 'Amount', min: 0, max: 1, default: 0.6 },
          { key: 'warmth', label: 'Warmth', min: 0, max: 1, default: 0.6 },
          { key: 'glow', label: 'Highlight Glow', min: 0, max: 1, default: 0.3 },
        ],
        fragmentShader: GOLDEN_HOUR_FS,
        uniforms: { uAmount: 'amount', uWarmth: 'warmth', uGlow: 'glow' },
      },
    ],
  },
})
