import { describe, expect, it } from 'vitest'
import { normalizeLang, phrasebookLookup, translateText, type FetchLike } from './translate.ts'

/** A fetch stub — the tests must never touch the network. */
const stubFetch = (
  reply: { ok?: boolean; body?: unknown; throws?: boolean },
  calls: { url: string; body: string }[] = [],
): FetchLike =>
  async (url, init) => {
    calls.push({ url, body: init.body })
    if (reply.throws) throw new Error('network down')
    return { ok: reply.ok ?? true, json: async () => reply.body }
  }

describe('phrasebookLookup', () => {
  it('translates common CTA lines in each supported language', () => {
    expect(phrasebookLookup('link in bio', 'es')).toBe('enlace en la bio')
    expect(phrasebookLookup('link in bio', 'fr')).toBe('lien dans la bio')
    expect(phrasebookLookup('link in bio', 'de')).toBe('link in der bio')
  })

  it('preserves the original casing and trailing punctuation', () => {
    expect(phrasebookLookup('SUBSCRIBE!', 'es')).toBe('SUSCRÍBETE!')
    expect(phrasebookLookup('Wait for it...', 'fr')).toBe('Attends la fin...')
    expect(phrasebookLookup('  follow for more  ', 'de')).toBe('folge für mehr')
  })

  it('returns undefined for phrases it does not know', () => {
    expect(phrasebookLookup('the third act twist', 'es')).toBeUndefined()
  })
})

describe('normalizeLang', () => {
  it('keeps only the primary subtag', () => {
    expect(normalizeLang('es-MX')).toBe('es')
    expect(normalizeLang(' FR ')).toBe('fr')
  })
})

describe('translateText', () => {
  it('falls back to the phrasebook when no endpoint is given', async () => {
    await expect(translateText('Shop now', { targetLang: 'de' })).resolves.toEqual({
      text: 'Jetzt shoppen',
      untranslated: false,
      source: 'phrasebook',
    })
  })

  it('marks unknown phrases untranslated and returns them unchanged', async () => {
    await expect(translateText('Our founder started in 2011', { targetLang: 'fr' })).resolves.toEqual({
      text: 'Our founder started in 2011',
      untranslated: true,
      source: 'none',
    })
  })

  it('marks everything untranslated for a language the phrasebook lacks', async () => {
    const result = await translateText('subscribe', { targetLang: 'ja' })
    expect(result).toMatchObject({ text: 'subscribe', untranslated: true, source: 'none' })
  })

  it('posts to <endpoint>/translate and uses translatedText', async () => {
    const calls: { url: string; body: string }[] = []
    const result = await translateText('Our founder started in 2011', {
      targetLang: 'es-MX',
      endpoint: 'https://translate.example/',
      fetch: stubFetch({ body: { translatedText: 'Nuestro fundador empezó en 2011' } }, calls),
    })

    expect(result).toEqual({
      text: 'Nuestro fundador empezó en 2011',
      untranslated: false,
      source: 'endpoint',
    })
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe('https://translate.example/translate')
    expect(JSON.parse(calls[0].body)).toEqual({
      q: 'Our founder started in 2011',
      source: 'auto',
      target: 'es',
    })
  })

  it('falls back to the phrasebook when the endpoint throws', async () => {
    const result = await translateText('Sound on', {
      targetLang: 'fr',
      endpoint: 'https://translate.example',
      fetch: stubFetch({ throws: true }),
    })
    expect(result).toMatchObject({ text: 'Mets le son', source: 'phrasebook' })
  })

  it('falls back when the endpoint answers with an error status or an unusable body', async () => {
    const errored = await translateText('Sound on', {
      targetLang: 'fr',
      endpoint: 'https://translate.example',
      fetch: stubFetch({ ok: false, body: { translatedText: 'ignored' } }),
    })
    expect(errored.source).toBe('phrasebook')

    const malformed = await translateText('Sound on', {
      targetLang: 'fr',
      endpoint: 'https://translate.example',
      fetch: stubFetch({ body: { error: 'quota' } }),
    })
    expect(malformed.source).toBe('phrasebook')
  })

  it('never sends caption text to a plaintext endpoint', async () => {
    const calls: { url: string; body: string }[] = []
    const result = await translateText('Sound on', {
      targetLang: 'fr',
      endpoint: 'http://translate.example',
      fetch: stubFetch({ body: { translatedText: 'should not be used' } }, calls),
    })
    expect(calls).toHaveLength(0)
    expect(result.source).toBe('phrasebook')
  })
})
