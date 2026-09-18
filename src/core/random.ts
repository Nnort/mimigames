/**
 * Честная перетасовка Фишера-Йетса.
 *
 * Сортировка со случайным компаратором тут не годится: она распределяет неравномерно,
 * а в паках правильный ответ обычно стоит первым в списке — он бы систематически
 * оказывался вверху.
 */
export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}
