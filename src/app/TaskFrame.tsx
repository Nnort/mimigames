import type { ReactNode } from 'react'

import { spriteUrl } from '../core/content'
import { speak } from '../core/speech'
import type { CharacterId, Emotion } from '../core/types'
import styles from './TaskFrame.module.css'

interface Props {
  title: string
  character: CharacterId
  emotion: Emotion
  /** Номер текущего шага, с единицы. */
  step: number
  total: number
  /** Что персонаж «говорит» — для кнопки «прочитать вслух». */
  speech?: string
  onExit: () => void
  children: ReactNode
  footer?: ReactNode
}

/**
 * Единая рамка всех заданий. Кнопка выхода, прогресс и озвучка всегда на одном
 * и том же месте — предсказуемость важнее разнообразия, см. PLAN.md §2.
 */
export function TaskFrame({
  title,
  character,
  emotion,
  step,
  total,
  speech,
  onExit,
  children,
  footer,
}: Props) {
  return (
    <div className={styles.frame}>
      <header className={styles.top}>
        <button className={styles.exit} onClick={onExit}>
          ← Выйти
        </button>

        <div className={styles.progress}>
          <span className={styles.progressText}>
            шаг {Math.min(step, total)} из {total}
          </span>
          <span className={styles.bar} aria-hidden>
            {Array.from({ length: total }, (_, i) => (
              <span key={i} className={i < step - 1 ? styles.dotDone : styles.dot} />
            ))}
          </span>
        </div>

        {speech ? (
          <button
            className={styles.speak}
            onClick={() => speak(speech)}
            title="Прочитать вслух"
          >
            🔊 Прочитать
          </button>
        ) : (
          <span />
        )}
      </header>

      <div className={styles.stage}>
        <div className={styles.buddy}>
          <img
            className={styles.face}
            src={spriteUrl(character, emotion)}
            alt=""
            draggable={false}
          />
          <p className={styles.taskTitle}>{title}</p>
        </div>

        <div className={styles.panel}>{children}</div>
      </div>

      {footer && <footer className={styles.footer}>{footer}</footer>}
    </div>
  )
}
