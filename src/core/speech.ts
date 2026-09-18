/**
 * Озвучка через встроенный синтез речи. Записывать ничего не нужно: русский голос
 * есть в Windows. Читает всегда по кнопке, никогда сама.
 */

let cachedVoice: SpeechSynthesisVoice | null | undefined
let soundOn = true

/** Настройка «Звук» из Settings. Глушит и синтез, и записанные реплики. */
export function setSoundEnabled(on: boolean): void {
  soundOn = on
  if (!on) stopSpeaking()
}

export function isSoundEnabled(): boolean {
  return soundOn
}

function russianVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice !== undefined) return cachedVoice
  const voices = window.speechSynthesis?.getVoices() ?? []
  cachedVoice = voices.find((v) => v.lang?.toLowerCase().startsWith('ru')) ?? null
  return cachedVoice
}

export function speechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speak(text: string, options: { rate?: number } = {}): void {
  if (!soundOn || !speechAvailable()) return
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ru-RU'
  utterance.rate = options.rate ?? 0.95
  const voice = russianVoice()
  if (voice) utterance.voice = voice
  window.speechSynthesis.speak(utterance)
}

/** Проговаривание по слогам — понадобится механике syllables. */
export function speakSyllables(syllables: string[]): void {
  speak(syllables.join(' — '), { rate: 0.75 })
}

export function stopSpeaking(): void {
  if (speechAvailable()) window.speechSynthesis.cancel()
}

// Список голосов в Chrome приезжает асинхронно, сбрасываем кэш при обновлении.
if (speechAvailable()) {
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    cachedVoice = undefined
  })
}
