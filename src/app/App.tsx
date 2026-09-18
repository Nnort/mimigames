import { useEffect, useState } from 'react'

import { packById } from '../core/content'
import { useProgress } from '../core/progress'
import { setSoundEnabled } from '../core/speech'
import { stopVoice } from '../core/voice'
import { AskPlayer } from '../mechanics/ask/AskPlayer'
import { QuizPlayer } from '../mechanics/quiz/QuizPlayer'
import { Hub } from './Hub'
import { ParentPanel } from './ParentPanel'
import { Settings } from './Settings'
import styles from './App.module.css'

type Screen =
  | { name: 'hub' }
  | { name: 'pack'; packId: string }
  | { name: 'settings' }
  | { name: 'parent' }

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'hub' })
  const { progress } = useProgress()
  const { sound, calm, fontScale } = progress.settings

  useEffect(() => {
    document.documentElement.dataset.calm = String(calm)
    document.documentElement.style.setProperty('--font-scale', String(fontScale))
  }, [calm, fontScale])

  useEffect(() => setSoundEnabled(sound), [sound])

  // Экран сменился — обрываем недочитанную реплику, иначе она звучит поверх нового.
  useEffect(() => stopVoice, [screen])

  const toHub = () => setScreen({ name: 'hub' })

  return (
    <div className={styles.shell}>
      {screen.name === 'hub' && (
        <Hub
          onOpenPack={(packId) => setScreen({ name: 'pack', packId })}
          onOpenSettings={() => setScreen({ name: 'settings' })}
          onOpenParent={() => setScreen({ name: 'parent' })}
        />
      )}

      {screen.name === 'pack' && <PackScreen packId={screen.packId} onExit={toHub} />}
      {screen.name === 'settings' && <Settings onExit={toHub} />}
      {screen.name === 'parent' && <ParentPanel onExit={toHub} />}
    </div>
  )
}

function PackScreen({ packId, onExit }: { packId: string; onExit: () => void }) {
  const pack = packById(packId)

  if (!pack) {
    return (
      <div className={styles.missing}>
        <p>Такой игры нет.</p>
        <button onClick={onExit}>Назад</button>
      </div>
    )
  }

  switch (pack.mechanic) {
    case 'quiz':
      return <QuizPlayer pack={pack} onExit={onExit} />
    case 'ask':
      return <AskPlayer pack={pack} onExit={onExit} />
    default:
      return (
        <div className={styles.missing}>
          <p>Эта игра ещё не готова.</p>
          <button onClick={onExit}>Назад</button>
        </div>
      )
  }
}
