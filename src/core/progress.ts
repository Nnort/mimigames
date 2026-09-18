import { useCallback, useEffect, useState } from 'react'

import { initialTopicState, recordAnswer, type TopicState } from './support'

const KEY = 'mimigame.progress.v1'

export interface Settings {
  sound: boolean
  /** Спокойный режим: минимум анимации. */
  calm: boolean
  /** Масштаб шрифта: 1 — обычный. */
  fontScale: number
}

export interface Progress {
  topics: Record<string, TopicState>
  /** id пройденных паков. */
  done: string[]
  /** Собранные шарики. */
  balloons: number
  settings: Settings
}

export const DEFAULT_SETTINGS: Settings = { sound: true, calm: false, fontScale: 1 }

function emptyProgress(): Progress {
  return { topics: {}, done: [], balloons: 0, settings: DEFAULT_SETTINGS }
}

function read(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyProgress()
    const parsed = JSON.parse(raw) as Partial<Progress>
    return {
      ...emptyProgress(),
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    }
  } catch {
    return emptyProgress()
  }
}

function write(progress: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress))
  } catch {
    // Приватный режим или заблокированное хранилище — играть это не мешает.
  }
}

/** Подписчики, чтобы разные экраны видели одно и то же состояние. */
const listeners = new Set<(p: Progress) => void>()
let current: Progress | null = null

function get(): Progress {
  if (current === null) current = read()
  return current
}

function set(next: Progress): void {
  current = next
  write(next)
  listeners.forEach((fn) => fn(next))
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(get)

  useEffect(() => {
    listeners.add(setProgress)
    return () => {
      listeners.delete(setProgress)
    }
  }, [])

  const topic = useCallback(
    (key: string): TopicState => get().topics[key] ?? initialTopicState(),
    [],
  )

  const answer = useCallback((key: string, correct: boolean) => {
    const prev = get()
    const before = prev.topics[key] ?? initialTopicState()
    set({ ...prev, topics: { ...prev.topics, [key]: recordAnswer(before, correct) } })
  }, [])

  const finishPack = useCallback((packId: string, balloons: number) => {
    const prev = get()
    set({
      ...prev,
      done: prev.done.includes(packId) ? prev.done : [...prev.done, packId],
      balloons: prev.balloons + balloons,
    })
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    const prev = get()
    set({ ...prev, settings: { ...prev.settings, ...patch } })
  }, [])

  const reset = useCallback(() => set(emptyProgress()), [])

  return { progress, topic, answer, finishPack, updateSettings, reset }
}
