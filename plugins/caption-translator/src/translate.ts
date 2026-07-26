/**
 * The pure translation logic — separated from the plugin wiring so it can be
 * unit tested without a sandbox (and without a network).
 *
 * Two strategies, in order:
 *   1. A LibreTranslate-compatible endpoint the user opts into per call. The
 *      network is only reachable because the manifest requests `net:fetch`, so
 *      the user can see (and refuse) that capability at install time.
 *   2. An offline phrasebook of the short call-to-action lines that dominate
 *      social captions. It ships in the bundle, so the plugin still does
 *      something useful with no endpoint, no key, and no data leaving the tab.
 *
 * Anything the phrasebook doesn't know comes back unchanged and marked
 * `untranslated`, so the caller never silently writes English over English.
 */

/** The languages the built-in phrasebook covers. */
export type PhrasebookLang = 'es' | 'fr' | 'de'

/** Minimal structural slice of `fetch`, so tests can inject a stub. The global
 *  `fetch` is assignable to it. */
export type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ ok: boolean; json(): Promise<unknown> }>

export interface TranslateOptions {
  /** BCP-47-ish target, e.g. "es" or "es-MX"; only the primary subtag is used. */
  targetLang: string
  /** LibreTranslate-compatible base URL, e.g. "https://translate.example". */
  endpoint?: string
  /** Injected for tests; pass the sandbox's global `fetch` in production. */
  fetch?: FetchLike
}

export interface Translation {
  /** The translated line, or the original when nothing could translate it. */
  text: string
  /** True when `text` is the untouched original. */
  untranslated: boolean
  /** Which strategy produced `text`. */
  source: 'endpoint' | 'phrasebook' | 'none'
}

/** English call-to-action lines that carry most short-form captions, keyed by
 *  their normalized (lowercased, single-spaced) form. Values stay lowercase;
 *  `applyCasing` restores the original line's capitalization. */
const PHRASEBOOK: Record<string, Record<PhrasebookLang, string>> = {
  subscribe: { es: 'suscríbete', fr: 'abonne-toi', de: 'abonnieren' },
  "don't forget to subscribe": {
    es: 'no olvides suscribirte',
    fr: "n'oublie pas de t'abonner",
    de: 'vergiss nicht zu abonnieren',
  },
  'follow for more': { es: 'sígueme para más', fr: 'suis-moi pour plus', de: 'folge für mehr' },
  'link in bio': { es: 'enlace en la bio', fr: 'lien dans la bio', de: 'link in der bio' },
  'wait for it': { es: 'espera el final', fr: 'attends la fin', de: 'warte es ab' },
  'like and share': { es: 'dale me gusta y comparte', fr: 'aime et partage', de: 'liken und teilen' },
  'watch till the end': { es: 'mira hasta el final', fr: "regarde jusqu'à la fin", de: 'schau bis zum ende' },
  'comment below': { es: 'comenta abajo', fr: 'commente ci-dessous', de: 'kommentiere unten' },
  'save this': { es: 'guarda esto', fr: 'enregistre ça', de: 'speicher dir das' },
  'sound on': { es: 'sube el volumen', fr: 'mets le son', de: 'ton an' },
  'swipe up': { es: 'desliza hacia arriba', fr: 'balaie vers le haut', de: 'nach oben wischen' },
  'tap to shop': { es: 'toca para comprar', fr: 'touche pour acheter', de: 'tippen zum shoppen' },
  'shop now': { es: 'compra ahora', fr: 'achète maintenant', de: 'jetzt shoppen' },
  'learn more': { es: 'más información', fr: 'en savoir plus', de: 'mehr erfahren' },
  'coming soon': { es: 'próximamente', fr: 'bientôt disponible', de: 'demnächst' },
  'limited time': { es: 'tiempo limitado', fr: 'durée limitée', de: 'nur kurze zeit' },
  'new video': { es: 'nuevo vídeo', fr: 'nouvelle vidéo', de: 'neues video' },
  'thanks for watching': { es: 'gracias por ver', fr: "merci d'avoir regardé", de: 'danke fürs zuschauen' },
  'try it yourself': { es: 'pruébalo tú mismo', fr: 'essaie toi-même', de: 'probier es selbst' },
  'how to': { es: 'cómo hacerlo', fr: 'comment faire', de: "so geht's" },
  before: { es: 'antes', fr: 'avant', de: 'vorher' },
  after: { es: 'después', fr: 'après', de: 'nachher' },
  'the results': { es: 'los resultados', fr: 'les résultats', de: 'das ergebnis' },
  'step 1': { es: 'paso 1', fr: 'étape 1', de: 'schritt 1' },
  'step 2': { es: 'paso 2', fr: 'étape 2', de: 'schritt 2' },
  'step 3': { es: 'paso 3', fr: 'étape 3', de: 'schritt 3' },
  'part 1': { es: 'parte 1', fr: 'partie 1', de: 'teil 1' },
}

/** Captions end in exclamation marks far more often than they contain them, so
 *  trailing punctuation is stripped for lookup and re-attached afterwards. */
const TRAILING_PUNCTUATION = /[!?.…]+$/

/** "es-MX" → "es". Also tolerates "ES_mx" and stray whitespace. */
export function normalizeLang(lang: string): string {
  return lang.trim().toLowerCase().split(/[-_]/)[0]
}

export function isPhrasebookLang(lang: string): lang is PhrasebookLang {
  return lang === 'es' || lang === 'fr' || lang === 'de'
}

/** Whole-string phrasebook lookup, preserving the original line's casing and
 *  trailing punctuation. Returns undefined when the phrase isn't known. */
export function phrasebookLookup(text: string, lang: PhrasebookLang): string | undefined {
  const trimmed = text.trim()
  const punctuation = trimmed.match(TRAILING_PUNCTUATION)?.[0] ?? ''
  const stem = trimmed
    .slice(0, trimmed.length - punctuation.length)
    .replace(/\s+/g, ' ')
    .toLowerCase()
  const entry = PHRASEBOOK[stem]
  if (!entry) return undefined
  return applyCasing(trimmed, entry[lang]) + punctuation
}

export async function translateText(text: string, opts: TranslateOptions): Promise<Translation> {
  const lang = normalizeLang(opts.targetLang)

  if (opts.endpoint && opts.fetch) {
    const remote = await translateViaEndpoint(text, lang, opts.endpoint, opts.fetch)
    if (remote !== undefined) return { text: remote, untranslated: false, source: 'endpoint' }
    // Fall through: an unreachable or misbehaving endpoint degrades to the
    // phrasebook rather than failing the whole caption pass.
  }

  if (isPhrasebookLang(lang)) {
    const hit = phrasebookLookup(text, lang)
    if (hit !== undefined) return { text: hit, untranslated: false, source: 'phrasebook' }
  }

  return { text, untranslated: true, source: 'none' }
}

/** POSTs one line to a LibreTranslate-compatible `/translate`. Returns
 *  undefined on any transport, status, or shape failure — the caller treats
 *  every failure the same way. */
async function translateViaEndpoint(
  text: string,
  lang: string,
  endpoint: string,
  fetchImpl: FetchLike,
): Promise<string | undefined> {
  // Caption text is user content; refuse to put it on the wire in the clear.
  if (!/^https:\/\//i.test(endpoint)) return undefined
  try {
    const res = await fetchImpl(`${endpoint.replace(/\/+$/, '')}/translate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ q: text, source: 'auto', target: lang }),
    })
    if (!res.ok) return undefined
    const body = (await res.json()) as { translatedText?: unknown }
    if (typeof body?.translatedText !== 'string' || body.translatedText.trim() === '') return undefined
    return body.translatedText
  } catch {
    return undefined
  }
}

/** Mirrors the original line's capitalization onto the lowercase translation:
 *  SHOUTED lines stay shouted, Sentence case stays sentence case. */
function applyCasing(original: string, translated: string): string {
  const letters = original.replace(/[^\p{L}]/gu, '')
  if (letters.length > 1 && letters === letters.toUpperCase()) return translated.toUpperCase()
  if (/^\p{Lu}/u.test(original)) return translated.charAt(0).toUpperCase() + translated.slice(1)
  return translated
}
