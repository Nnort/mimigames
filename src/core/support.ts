import { SUPPORT_LEVELS, type SupportLevel } from './types'

/**
 * Движок уровней поддержки.
 *
 * Правило из PLAN.md §2: открытый вопрос без модели ответа не задаётся никогда.
 * Тема стартует с L0 и поднимается только после серии успехов; при затруднении
 * уровень молча возвращается вниз, без всякой пометки «не справилась».
 */

export const PROMOTE_AFTER = 3
export const DEMOTE_AFTER = 2

export interface TopicState {
  level: SupportLevel
  /** Успехов подряд на текущем уровне. */
  streak: number
  /** Ошибок на текущем уровне. */
  misses: number
  seen: number
  correct: number
}

export function initialTopicState(): TopicState {
  return { level: 'L0', streak: 0, misses: 0, seen: 0, correct: 0 }
}

function shift(level: SupportLevel, by: number): SupportLevel {
  const index = SUPPORT_LEVELS.indexOf(level)
  const next = Math.min(SUPPORT_LEVELS.length - 1, Math.max(0, index + by))
  return SUPPORT_LEVELS[next]
}

/** Поддержки больше — значит уровень ниже. L0 — максимальная поддержка. */
export function isMaxSupport(level: SupportLevel): boolean {
  return level === 'L0'
}

export function recordAnswer(state: TopicState, correct: boolean): TopicState {
  const next: TopicState = {
    ...state,
    seen: state.seen + 1,
    correct: state.correct + (correct ? 1 : 0),
  }

  if (correct) {
    next.streak = state.streak + 1
    if (next.streak >= PROMOTE_AFTER) {
      next.level = shift(state.level, 1)
      next.streak = 0
      next.misses = 0
    }
    return next
  }

  next.streak = 0
  next.misses = state.misses + 1
  if (next.misses >= DEMOTE_AFTER) {
    next.level = shift(state.level, -1)
    next.misses = 0
  }
  return next
}

/**
 * Сколько вариантов ответа показывать на данном уровне.
 * L0 — выбор из двух, ответ фактически виден; дальше поле расширяется.
 */
export function optionsForLevel(level: SupportLevel, available: number): number {
  const byLevel: Record<SupportLevel, number> = {
    L0: 2,
    L1: 3,
    L2: 4,
    L3: available,
    L4: available,
  }
  return Math.min(available, Math.max(2, byLevel[level]))
}

/**
 * Размер поля в «Угадай, что я загадал». На низком уровне предметов мало:
 * ребёнок должен увидеть, что вопрос сужает поле, а на двенадцати картинках
 * этот эффект теряется.
 */
export function fieldForLevel(level: SupportLevel, available: number): number {
  const byLevel: Record<SupportLevel, number> = {
    L0: 4,
    L1: 6,
    L2: 9,
    L3: available,
    L4: available,
  }
  return Math.min(available, byLevel[level])
}

/** Сколько вопросов доступно. Длинный список на старте сам по себе труден. */
export function questionsForLevel(level: SupportLevel, available: number): number {
  const byLevel: Record<SupportLevel, number> = {
    L0: 3,
    L1: 4,
    L2: 6,
    L3: available,
    L4: available,
  }
  return Math.min(available, byLevel[level])
}

/** На низких уровнях подсказка видна сразу, дальше — только по кнопке. */
export function hintPolicy(level: SupportLevel): 'always' | 'on-request' | 'none' {
  if (level === 'L0') return 'always'
  if (level === 'L4') return 'none'
  return 'on-request'
}

export const LEVEL_LABEL: Record<SupportLevel, string> = {
  L0: 'выбор из двух',
  L1: 'выбор из трёх',
  L2: 'выбор из четырёх',
  L3: 'все варианты',
  L4: 'без подсказок',
}
