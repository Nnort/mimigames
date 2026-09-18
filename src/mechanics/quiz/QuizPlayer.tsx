import { useMemo, useState } from 'react'

import { TaskFrame } from '../../app/TaskFrame'
import { topicKey } from '../../core/content'
import { useProgress } from '../../core/progress'
import { shuffle } from '../../core/random'
import { speak } from '../../core/speech'
import { hintPolicy, optionsForLevel } from '../../core/support'
import type { Emotion, QuizPack, Stimulus } from '../../core/types'
import styles from './QuizPlayer.module.css'

type Phase = 'asking' | 'missed' | 'revealed' | 'correct' | 'done'

interface Props {
  pack: QuizPack
  onExit: () => void
}

export function QuizPlayer({ pack, onExit }: Props) {
  const { topic, answer, finishPack } = useProgress()
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('asking')
  const [picked, setPicked] = useState<number | null>(null)
  const [hintShown, setHintShown] = useState(false)
  const [rightFirstTry, setRightFirstTry] = useState(0)

  const key = topicKey(pack)
  const level = topic(key).level
  const item = pack.items[index]

  /** На низком уровне поле сужается: показываем не все варианты, но правильный — всегда. */
  const shown = useMemo(() => {
    if (!item) return []
    const limit = optionsForLevel(level, item.options.length)
    const others = shuffle(item.options.map((_, i) => i).filter((i) => i !== item.answer))
    return shuffle([item.answer, ...others.slice(0, limit - 1)])
  }, [item, level])

  if (phase === 'done') {
    return (
      <Summary
        pack={pack}
        rightFirstTry={rightFirstTry}
        onExit={onExit}
        onRestart={() => {
          setIndex(0)
          setPhase('asking')
          setPicked(null)
          setHintShown(false)
          setRightFirstTry(0)
        }}
      />
    )
  }

  if (!item) return null

  const stimulus = item.stimulus ?? pack.stimulus
  const policy = hintPolicy(level)
  const showHint = item.hint && (policy === 'always' || (policy === 'on-request' && hintShown))

  const choose = (option: number) => {
    if (phase === 'correct' || phase === 'revealed') return
    setPicked(option)

    if (option === item.answer) {
      if (phase === 'asking') {
        answer(key, true)
        setRightFirstTry((n) => n + 1)
      }
      setPhase('correct')
      return
    }

    if (phase === 'asking') {
      answer(key, false)
      setPhase('missed')
    } else {
      // Вторая ошибка — показываем правильный ответ, а не гоняем по кругу.
      setPhase('revealed')
    }
  }

  const next = () => {
    if (index + 1 >= pack.items.length) {
      finishPack(pack.id, rightFirstTry)
      setPhase('done')
      return
    }
    setIndex(index + 1)
    setPhase('asking')
    setPicked(null)
    setHintShown(false)
  }

  // На ошибку персонаж задумывается, а не грустит: слёзы Вера прочитает как
  // «я его расстроила». См. docs/style-guide.md.
  const emotion: Emotion =
    phase === 'correct' ? 'happy' : phase === 'asking' ? 'question' : 'thinking'

  const settled = phase === 'correct' || phase === 'revealed'
  const speech = [stimulus?.type === 'text' ? stimulus.value : '', item.question]
    .filter(Boolean)
    .join('. ')

  return (
    <TaskFrame
      title={pack.title}
      character={pack.character}
      emotion={emotion}
      step={index + 1}
      total={pack.items.length}
      speech={speech}
      onExit={onExit}
      footer={
        settled && (
          <button className={styles.next} onClick={next}>
            {index + 1 >= pack.items.length ? 'Закончить' : 'Дальше →'}
          </button>
        )
      }
    >
      {stimulus && <StimulusView stimulus={stimulus} />}

      <h2 className={styles.question}>{item.question}</h2>

      <ul className={styles.options}>
        {shown.map((option) => (
          <li key={option}>
            <button
              className={optionClass(option, item.answer, picked, phase)}
              onClick={() => choose(option)}
              disabled={settled}
            >
              {item.options[option]}
            </button>
          </li>
        ))}
      </ul>

      {showHint && <p className={styles.hint}>💡 {item.hint}</p>}

      {policy === 'on-request' && item.hint && !hintShown && !settled && (
        <button className={styles.hintButton} onClick={() => setHintShown(true)}>
          Подсказка
        </button>
      )}

      {phase === 'missed' && (
        <p className={styles.missed}>Не этот. Попробуй ещё раз.</p>
      )}

      {phase === 'revealed' && (
        <p className={styles.missed}>
          Правильный ответ — «{item.options[item.answer]}».
        </p>
      )}

      {settled && item.explain && <p className={styles.explain}>{item.explain}</p>}
    </TaskFrame>
  )
}

function optionClass(
  option: number,
  correct: number,
  picked: number | null,
  phase: Phase,
): string {
  const settled = phase === 'correct' || phase === 'revealed'
  if (settled && option === correct) return styles.optionRight
  if (picked === option && phase !== 'correct') return styles.optionMiss
  return styles.option
}

function StimulusView({ stimulus }: { stimulus: Stimulus }) {
  if (stimulus.type === 'image') {
    return (
      <img className={styles.picture} src={`/assets/${stimulus.value}`} alt="" />
    )
  }
  return (
    <div className={styles.passage}>
      <p className={styles.passageText}>{stimulus.value}</p>
      <button
        className={styles.passageSpeak}
        onClick={() => speak(stimulus.value)}
        title="Прочитать вслух"
      >
        🔊
      </button>
    </div>
  )
}

function Summary({
  pack,
  rightFirstTry,
  onExit,
  onRestart,
}: {
  pack: QuizPack
  rightFirstTry: number
  onExit: () => void
  onRestart: () => void
}) {
  return (
    <div className={styles.summary}>
      <div className={styles.balloons} aria-hidden>
        {'🎈'.repeat(Math.max(1, Math.min(rightFirstTry, 10)))}
      </div>
      <h1 className={styles.summaryTitle}>Готово!</h1>
      <p className={styles.summaryText}>
        Ты прошла все {pack.items.length} шагов и заработала {rightFirstTry}{' '}
        {rightFirstTry === 1 ? 'шарик' : rightFirstTry < 5 ? 'шарика' : 'шариков'}.
      </p>
      <div className={styles.summaryButtons}>
        <button className={styles.next} onClick={onExit}>
          На карту
        </button>
        <button className={styles.again} onClick={onRestart}>
          Ещё раз
        </button>
      </div>
    </div>
  )
}
