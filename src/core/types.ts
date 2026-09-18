export type Emotion =
  | 'neutral'
  | 'happy'
  | 'question'
  | 'surprised'
  | 'sad'
  | 'thinking'

export type CharacterId = 'vera' | 'tom' | 'ben' | 'hank' | 'angela' | 'ginger'

export type LocationId = 'home' | 'yard' | 'school' | 'shop' | 'park' | 'clinic'

export type MechanicId =
  | 'quiz'
  | 'ask'
  | 'recount'
  | 'dialog'
  | 'rephrase'
  | 'syllables'
  | 'problem'
  | 'letters'
  | 'input'
  | 'sort'
  | 'sequence'
  | 'social'
  | 'arcade'

/**
 * Уровни поддержки. Открытый вопрос (L4) без модели ответа провоцирует эхолалию,
 * поэтому любая тема стартует с L0 и поднимается только по факту успеха.
 * См. PLAN.md §2.
 */
export const SUPPORT_LEVELS = ['L0', 'L1', 'L2', 'L3', 'L4'] as const
export type SupportLevel = (typeof SUPPORT_LEVELS)[number]

export interface Stimulus {
  type: 'text' | 'image'
  /** Текст стимула либо путь к картинке относительно /assets. */
  value: string
}

export interface QuizItem {
  question: string
  options: string[]
  /** Индекс правильного варианта в options. */
  answer: number
  hint?: string
  explain?: string
  /** Переопределяет общий стимул пака. */
  stimulus?: Stimulus
}

export interface QuizPack {
  id: string
  mechanic: 'quiz'
  title: string
  location: LocationId
  character: CharacterId
  /** Ключ темы для уровня поддержки. По умолчанию — id пака. */
  topic?: string
  /** Общий стимул на весь пак: текст для чтения или картинка. */
  stimulus?: Stimulus
  items: QuizItem[]
}

/** Предмет из общего справочника content/items.json. */
export interface ItemDef {
  title: string
  /** Свойства, по которым его отсеивают вопросы. */
  props: string[]
}

export interface AskQuestion {
  text: string
  /** Свойство из ItemDef.props, которое проверяет вопрос. */
  prop: string
}

export interface AskPack {
  id: string
  mechanic: 'ask'
  mode: 'guess'
  title: string
  location: LocationId
  character: CharacterId
  topic?: string
  /** id предметов из общего справочника. */
  items: string[]
  questions: AskQuestion[]
  /** Сколько предметов загадать за игру. */
  rounds: number
}

export type Pack = QuizPack | AskPack
