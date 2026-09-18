import { isSoundEnabled, speak, stopSpeaking } from './speech'

/**
 * Два слоя озвучки.
 *
 * Постоянные реплики — реакции, инструкции, похвала — записаны маминым голосом
 * и лежат в src/assets/voice. Их немного, они не меняются, и именно они задают
 * интонацию игры.
 *
 * Переменный слой — тексты и вопросы паков — читает синтез: контента будет много,
 * и записывать каждый новый пак вручную значит убить всю идею «новая игра = новый JSON».
 *
 * Если записи нет, say() молча уходит в синтез. Поэтому записи можно добавлять
 * по одной и в любом порядке, не трогая код.
 */

const clips = import.meta.glob('../assets/voice/**/*.{mp3,m4a,ogg,wav}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

/** '../assets/voice/feedback/try-again.mp3' -> 'feedback/try-again' */
const BY_ID: Record<string, string> = Object.fromEntries(
  Object.entries(clips).map(([path, url]) => [
    path.replace('../assets/voice/', '').replace(/\.[^.]+$/, ''),
    url,
  ]),
)

let playing: HTMLAudioElement | null = null

export function hasClip(id: string): boolean {
  return id in BY_ID
}

export function stopVoice(): void {
  if (playing) {
    playing.pause()
    playing = null
  }
  stopSpeaking()
}

/**
 * Говорит реплику: записью, если она есть, иначе синтезом.
 * `text` нужен всегда — он же показывается на экране и служит запасным вариантом.
 */
export function say(id: string, text: string): void {
  if (!isSoundEnabled()) return
  stopVoice()

  const url = BY_ID[id]
  if (!url) {
    speak(text)
    return
  }

  const audio = new Audio(url)
  playing = audio
  // Файл может быть битым или не поддерживаться — тогда всё равно озвучиваем.
  audio.addEventListener('error', () => speak(text))
  void audio.play().catch(() => speak(text))
}

/** Сколько постоянных реплик уже записано — видно в панели для взрослых. */
export function recordedCount(): number {
  return Object.keys(BY_ID).length
}
