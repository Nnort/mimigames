import { useProgress } from '../core/progress'
import { speak } from '../core/speech'
import styles from './Panel.module.css'

export function Settings({ onExit }: { onExit: () => void }) {
  const { progress, updateSettings } = useProgress()
  const { sound, calm, fontScale } = progress.settings

  return (
    <div className={styles.panel}>
      <button className={styles.back} onClick={onExit}>
        ← Назад
      </button>
      <h1 className={styles.title}>Настройки</h1>

      <label className={styles.row}>
        <input
          type="checkbox"
          checked={sound}
          onChange={(e) => updateSettings({ sound: e.target.checked })}
        />
        <span>
          <b>Звук</b>
          <small>Персонажи звучат и читают вслух</small>
        </span>
      </label>

      <label className={styles.row}>
        <input
          type="checkbox"
          checked={calm}
          onChange={(e) => updateSettings({ calm: e.target.checked })}
        />
        <span>
          <b>Спокойный режим</b>
          <small>Без движения и плавных переходов</small>
        </span>
      </label>

      <div className={styles.row}>
        <span>
          <b>Размер букв</b>
          <small>Сейчас {Math.round(fontScale * 100)}%</small>
        </span>
        <div className={styles.steps}>
          {[0.9, 1, 1.15, 1.3].map((scale) => (
            <button
              key={scale}
              className={scale === fontScale ? styles.stepOn : styles.step}
              onClick={() => updateSettings({ fontScale: scale })}
            >
              {Math.round(scale * 100)}%
            </button>
          ))}
        </div>
      </div>

      <button className={styles.test} onClick={() => speak('Привет! Меня слышно?')}>
        🔊 Проверить голос
      </button>
    </div>
  )
}
