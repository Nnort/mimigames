import { useState } from 'react'

import { PACKS, topicKey, topicTitle } from '../core/content'
import { useProgress } from '../core/progress'
import { LEVEL_LABEL, initialTopicState } from '../core/support'
import styles from './Panel.module.css'

/**
 * Панель для мамы. Вера играет одна, поэтому без этого экрана непонятно,
 * работает ли вообще. См. PLAN.md §11.
 */
export function ParentPanel({ onExit }: { onExit: () => void }) {
  const { progress, reset } = useProgress()
  const [confirming, setConfirming] = useState(false)

  const topics = Array.from(new Set(PACKS.map(topicKey)))

  return (
    <div className={styles.panel}>
      <button className={styles.back} onClick={onExit}>
        ← Назад
      </button>
      <h1 className={styles.title}>Для взрослых</h1>
      <p className={styles.lead}>
        Уровень поддержки поднимается сам после трёх верных ответов подряд и так же
        молча возвращается вниз после двух ошибок. Низкий уровень — не отставание,
        а опора, на которой ответ вообще получается.
      </p>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Тема</th>
            <th>Поддержка</th>
            <th>Ответов</th>
            <th>Верно</th>
          </tr>
        </thead>
        <tbody>
          {topics.map((key) => {
            const state = progress.topics[key] ?? initialTopicState()
            return (
              <tr key={key}>
                <td>{topicTitle(key)}</td>
                <td>
                  <b>{state.level}</b> · {LEVEL_LABEL[state.level]}
                </td>
                <td>{state.seen}</td>
                <td>
                  {state.seen > 0 ? `${Math.round((state.correct / state.seen) * 100)}%` : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <p className={styles.lead}>
        Шариков собрано: <b>{progress.balloons}</b>. Пройдено игр:{' '}
        <b>{progress.done.length}</b>.
      </p>

      {confirming ? (
        <div className={styles.confirm}>
          <span>Сбросить весь прогресс? Это не отменить.</span>
          <button className={styles.danger} onClick={reset}>
            Да, сбросить
          </button>
          <button className={styles.step} onClick={() => setConfirming(false)}>
            Отмена
          </button>
        </div>
      ) : (
        <button className={styles.step} onClick={() => setConfirming(true)}>
          Сбросить прогресс
        </button>
      )}
    </div>
  )
}
