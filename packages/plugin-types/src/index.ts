/**
 * @corte/plugin-types — the author-facing contract for Corte marketplace
 * plugins: the manifest you publish, and the sandbox context your code bundle
 * receives at runtime.
 *
 * This package is a type-for-type mirror of Corte's `@eli/plugin-sdk`
 * (manifest + sandbox surface). It exists so this repo builds standalone; once
 * the SDK ships on npm, depend on that instead — the shapes are identical.
 * Everything here is erased at build time, so bundles stay self-contained.
 */

// --- Manifest ----------------------------------------------------------------

/** A numeric, keyframable effect parameter. */
export interface EffectParamSpec {
  key: string
  label: string
  min: number
  max: number
  default: number
  unit?: string
}

/** Permissions a marketplace plugin may request at install time. */
export type PluginManifestPermission =
  | 'read:timeline'
  | 'read:media'
  | 'write:clips'
  | 'write:effects'
  | 'notify'
  /** Keep network APIs (fetch/XHR/WebSocket) available inside the sandbox
   *  worker — e.g. to call the plugin's own service. Stripped otherwise. */
  | 'net:fetch'

/** Serializable "start from template" contribution. */
export interface PluginManifestTemplate {
  id: string
  name: string
  description?: string
  category?: string
  width: number
  height: number
  fps: number
  texts?: { content: string; startFrame: number; endFrame: number }[]
  slots?: {
    role: string
    kind: 'video' | 'image' | 'audio'
    assetRef?: string
    query?: { kind?: 'video' | 'image' | 'audio'; tags?: string[]; vertical?: string }
    startFrame: number
    endFrame: number
    trackIndex?: number
  }[]
  thumbnailUrl?: string
}

/** Serializable library-asset contribution (stock the templates resolve against). */
export interface PluginManifestLibraryAsset {
  id: string
  kind: 'video' | 'image' | 'audio'
  url: string
  name: string
  tags?: string[]
  vertical?: string
  thumbnailUrl?: string
  durationSeconds?: number
}

/** Serializable model-catalog contribution. */
export interface PluginManifestModel {
  id: string
  kind: 'video' | 'image' | 'audio' | 'upscale'
  displayName: string
  provider: string
  paidOnly?: boolean
  pricingLabel?: string
}

/** An agent-tool DESCRIPTOR (no code). The implementation lives in the
 *  sandboxed bundle; a manifest with tools must be published with one.
 *  Tool names stay dotted here — the host advertises them to the AI model
 *  with dots as underscores. */
export interface PluginManifestTool {
  /** Namespaced under the plugin id, e.g. "com.acme.captions.count_words". */
  name: string
  description: string
  /** JSON Schema for the tool's arguments. */
  inputSchema: Record<string, unknown>
  /** Read-only tools skip the agent-undo bookkeeping. */
  readOnly?: boolean
}

/** A serializable shader effect: descriptor + single-pass GLSL (ES 300)
 *  fragment shader sampling `uTex` at the host-provided `vUV` varying, plus a
 *  declarative uniform map (uniform name → param key, resolved per frame). */
export interface PluginManifestEffect {
  /** Namespaced under the plugin id, e.g. "com.acme.captions.vignette". */
  type: string
  displayName: string
  category: 'color' | 'detail' | 'key' | 'blur' | 'stylize'
  params: EffectParamSpec[]
  fragmentShader?: string
  /** GLSL uniform name → param key. */
  uniforms?: Record<string, string>
}

/** What an author publishes. Every contribution id must be namespaced under
 *  the plugin id; a code bundle is required whenever `tools` is non-empty. */
export interface PluginManifest {
  version: 1
  /** Reverse-DNS plugin id, e.g. "com.acme.captions". Globally unique. */
  id: string
  name: string
  /** Semver of this publish; each publish is a new immutable version. */
  pluginVersion: string
  description?: string
  /** Long-form marketplace copy (blank-line separated paragraphs). */
  about?: string
  /** Square icon (https URL) shown on marketplace cards. */
  iconUrl?: string
  /** Discovery tags shown on the detail page. */
  tags?: string[]
  /** Showcase images (https URLs) for the marketplace detail page. */
  screenshots?: string[]
  permissions?: PluginManifestPermission[]
  contributions: {
    templates?: PluginManifestTemplate[]
    library?: PluginManifestLibraryAsset[]
    models?: PluginManifestModel[]
    tools?: PluginManifestTool[]
    effects?: PluginManifestEffect[]
  }
}

/** Identity helper that type-checks a manifest authored in TS. */
export function defineManifest(manifest: PluginManifest): PluginManifest {
  return manifest
}

// --- Sandbox runtime ---------------------------------------------------------

export interface ClipInfo {
  id: string
  mediaType: string
  startFrame: number
  durationFrames: number
  /** The rendered text of a text clip (mediaType "text"); absent otherwise. */
  text?: string
}
export interface TrackInfo {
  type: 'video' | 'audio'
  clips: ClipInfo[]
}
export interface TimelineInfo {
  id: string
  name: string
  fps: number
  width: number
  height: number
  durationFrames: number
  /** Formatted timecode of the total duration, e.g. "00:00:03:00". */
  duration: string
  tracks: TrackInfo[]
}
export interface MediaAssetInfo {
  id: string
  name: string
  type: string
  durationSeconds: number
}

/** Friendly result an agent tool returns; the host maps it to the internal shape. */
export type ToolResult =
  | { text: string; isError?: boolean }
  | { json: unknown; isError?: boolean }

/** The editor surface inside the sandbox worker. Every call crosses the worker
 *  boundary as a message and is checked against the user's granted permissions. */
export interface SandboxEditorApi {
  /** read:timeline */
  getTimeline(): Promise<TimelineInfo>
  /** read:timeline */
  getSelectedClipIds(): Promise<string[]>
  /** read:media */
  getMediaAssets(): Promise<MediaAssetInfo[]>
  /** write:effects — apply a built-in or plugin effect to clips. */
  applyEffect(clipIds: string[], effect: { type: string; params?: Record<string, number> }): Promise<void>
  /** write:clips — add a text clip; returns the created clip ids. */
  addText(spec: { content: string; startFrame: number; endFrame: number; trackIndex?: number }): Promise<string[]>
  /** write:clips — rewrite a text clip's content. False if not a text clip. */
  setClipText(clipId: string, content: string): Promise<boolean>
  /** write:clips — reposition a clip. False when the move is invalid. */
  moveClip(clipId: string, to: { frame?: number; trackIndex?: number }): Promise<boolean>
  /** write:clips — split a clip at an absolute frame inside it. */
  splitClip(clipId: string, atFrame: number): Promise<boolean>
  /** notify */
  showToast(message: string, kind?: 'info' | 'success' | 'error'): Promise<void>
}

export interface SandboxMediaApi {
  /** read:media — the raw bytes of an asset. */
  getBlob(assetId: string): Promise<Blob | undefined>
  /** read:media — host-decoded mono PCM, downsampled to ~targetHz (default
   *  8000). The primitive for audio analysis; workers can't decode audio. */
  getAudioSamples(assetId: string, opts?: { targetHz?: number }): Promise<{ sampleRate: number; samples: Float32Array } | undefined>
}

export interface PluginMeta {
  id: string
  name: string
  version: string
  description?: string
  permissions?: PluginManifestPermission[]
}

/** What a sandboxed plugin's bundle sees. Only tool HANDLERS live in the
 *  bundle — descriptors and every data contribution ship in the manifest.
 *  `tools.register` supplies the handler matching a manifest-declared name. */
export interface SandboxPluginContext {
  meta: PluginMeta
  editor: SandboxEditorApi
  media: SandboxMediaApi
  tools: {
    register(tool: {
      /** Must match a tool name declared in the manifest. */
      name: string
      handler: (args: Record<string, unknown>) => ToolResult | Promise<ToolResult>
    }): void
  }
}

export interface SandboxPlugin {
  meta: PluginMeta
  activate(ctx: SandboxPluginContext): void | (() => void)
}

/** Identity helper for sandboxed plugin bundles. The bundle's default export
 *  (or `plugin` export) must be the returned object. */
export function defineSandboxPlugin(plugin: SandboxPlugin): SandboxPlugin {
  return plugin
}
