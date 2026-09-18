import itemsCatalog from '../../content/items.json'
import type { CharacterId, Emotion, ItemDef, LocationId, Pack } from './types'

/**
 * Паки лежат в /content и подхватываются автоматически. Добавление новой игры —
 * это добавление JSON-файла, править код не требуется.
 */
const modules = import.meta.glob<{ default: unknown }>('../../content/**/*.json', {
  eager: true,
})

function isPack(value: unknown): value is Pack {
  return typeof value === 'object' && value !== null && 'mechanic' in value
}

export const PACKS: Pack[] = Object.values(modules)
  .map((m) => m.default)
  // В /content лежит не только паки: там же общий справочник предметов.
  .filter(isPack)
  .sort((a, b) => a.title.localeCompare(b.title, 'ru'))

/** Общий справочник предметов: один и тот же предмет используют разные паки. */
export const ITEMS = itemsCatalog as Record<string, ItemDef>

export function itemUrl(id: string): string {
  return `/assets/items/${id}.png`
}

export function packsForLocation(location: LocationId): Pack[] {
  return PACKS.filter((p) => p.location === location)
}

export function packById(id: string): Pack | undefined {
  return PACKS.find((p) => p.id === id)
}

export function topicKey(pack: Pack): string {
  return pack.topic ?? pack.id
}

export function spriteUrl(character: CharacterId, emotion: Emotion): string {
  return `/assets/characters/${character}/${emotion}.png`
}

export function backgroundUrl(location: LocationId): string {
  return `/assets/backgrounds/${location}.jpg`
}

export interface LocationInfo {
  id: LocationId
  title: string
  /** Заглушка на время, пока фон не сгенерирован. */
  tint: string
  /** Фон уже лежит в public/assets/backgrounds. Без флага браузер ловил бы 404. */
  art?: boolean
}

export const LOCATIONS: LocationInfo[] = [
  { id: 'home', title: 'Дом', tint: '#8FC2E8', art: true },
  { id: 'yard', title: 'Двор', tint: '#6FA83C', art: true },
  { id: 'school', title: 'Школа', tint: '#C98A5E', art: true },
  { id: 'shop', title: 'Магазин', tint: '#D9A32F', art: true },
  { id: 'park', title: 'Парк', tint: '#5E9E7E', art: true },
  { id: 'clinic', title: 'Поликлиника', tint: '#9A8FD0', art: true },
]

/** Человеческие названия тем для панели взрослых: тема шире одного пака. */
export const TOPIC_TITLES: Record<string, string> = {
  'reading-fact': 'Чтение: факты из текста',
  'ask-questions': 'Умение задавать вопросы',
}

export function topicTitle(key: string): string {
  return TOPIC_TITLES[key] ?? key
}
