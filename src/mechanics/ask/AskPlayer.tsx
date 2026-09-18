import { useState } from 'react'

import { TaskFrame } from '../../app/TaskFrame'
import { ITEMS, itemUrl, topicKey } from '../../core/content'
import { useProgress } from '../../core/progress'
import { pick, shuffle } from '../../core/random'
import { fieldForLevel, questionsForLevel } from '../../core/support'
import type { AskPack, AskQuestion, Emotion, SupportLevel } from '../../core/types'
import { say } from '../../core/voice'
import styles from './AskPlayer.module.css'

/**
 * «Угадай, что я загадал» — механика, в которой **вопросы задаёт ребёнок**.
 *
 * Весь развивающий софт устроен наоборот: спрашивает программа, отвечает ребёнок.
 * То есть он закрепляет ровно то, что у Веры и так западает. Здесь наоборот,
 * и главное в экране — не угадывание, а видимая польза вопроса: после каждого
 * ответа Тома лишние предметы гаснут прямо на глазах.
 *
 * Отсюда же и правило: за количество вопросов не наказываем. Наоборот, раунд
 * считается успешным, только если Вера спросила хотя бы раз, а не ткнула наугад.
 */

interface Props {
  pack: AskPack
  onExit: () => void
}

interface Round {
  field: string[]
  secret: string
  questions: AskQuestion[]
  asked: number[]
  excluded: string[]
  answer: { text: string; yes: boolean } | null
  emotion: Emotion
  won: boolean
}

function has(itemId: string, prop: string): boolean {
  return ITEMS[itemId]?.props.includes(prop) ?? false
}

/**
 * Вопрос полезен, только если он делит поле: хотя бы один предмет со свойством
 * и хотя бы один без него. Иначе ответ ничего не гасит, и ребёнок делает вывод,
 * что спрашивать бессмысленно — ровно противоположный нужному.
 */
function informative(questions: AskQuestion[], field: string[]): AskQuestion[] {
  return questions.filter((q) => {
    const yes = field.filter((id) => has(id, q.prop)).length
    return yes > 0 && yes < field.length
  })
}

function newRound(pack: AskPack, level: SupportLevel): Round {
  const size = fieldForLevel(level, pack.items.length)
  const field = shuffle(pack.items).slice(0, size)
  const useful = informative(pack.questions, field)
  const limit = questionsForLevel(level, useful.length)

  return {
    field,
    secret: pick(field),
    questions: shuffle(useful).slice(0, limit),
    asked: [],
    excluded: [],
    answer: null,
    emotion: 'question',
    won: false,
  }
}

export function AskPlayer({ pack, onExit }: Props) {
  const { topic, answer: record, finishPack } = useProgress()
  const key = topicKey(pack)
  const level = topic(key).level

  const [roundNumber, setRoundNumber] = useState(0)
  const [round, setRound] = useState<Round>(() => newRound(pack, level))
  const [solved, setSolved] = useState(0)
  const [done, setDone] = useState(false)

  if (done) {
    return (
      <Summary
        solved={solved}
        total={pack.rounds}
        onExit={onExit}
        onRestart={() => {
          setRoundNumber(0)
          setRound(newRound(pack, level))
          setSolved(0)
          setDone(false)
        }}
      />
    )
  }

  const left = round.field.filter((id) => !round.excluded.includes(id))

  const ask = (index: number) => {
    if (round.won || round.asked.includes(index)) return
    const question = round.questions[index]
    const yes = has(round.secret, question.prop)

    const excluded = [
      ...round.excluded,
      ...round.field.filter(
        (id) => !round.excluded.includes(id) && has(id, question.prop) !== yes,
      ),
    ]

    setRound({
      ...round,
      asked: [...round.asked, index],
      excluded,
      answer: { text: question.text, yes },
      // Том радуется самому вопросу, а не правильному ответу: подкрепляем
      // то поведение, ради которого механика и сделана.
      emotion: 'happy',
    })
    say(yes ? 'ask/yes' : 'ask/no', yes ? 'Да' : 'Нет')
  }

  const guess = (id: string) => {
    if (round.won || round.excluded.includes(id)) return

    if (id === round.secret) {
      // Для уровня поддержки успех — это «спросила и угадала». Ткнуть наугад
      // и попасть успехом не считаем: тренируем вопрос, а не везение.
      record(key, round.asked.length > 0)
      setSolved((n) => n + 1)
      setRound({ ...round, won: true, emotion: 'happy', answer: null })
      say('ask/right', `Да! Это ${ITEMS[id].title.toLowerCase()}.`)
      return
    }

    setRound({
      ...round,
      excluded: [...round.excluded, id],
      emotion: 'thinking',
      answer: null,
    })
    say('ask/wrong', 'Нет, не это.')
  }

  const next = () => {
    if (roundNumber + 1 >= pack.rounds) {
      finishPack(pack.id, solved)
      setDone(true)
      return
    }
    setRoundNumber(roundNumber + 1)
    setRound(newRound(pack, level))
  }

  return (
    <TaskFrame
      title={pack.title}
      character={pack.character}
      emotion={round.emotion}
      step={roundNumber + 1}
      total={pack.rounds}
      onExit={onExit}
      footer={
        round.won && (
          <button className={styles.next} onClick={next}>
            {roundNumber + 1 >= pack.rounds ? 'Закончить' : 'Дальше →'}
          </button>
        )
      }
    >
      <p className={styles.lead}>
        {round.won
          ? `Верно! Я загадал: ${ITEMS[round.secret].title.toLowerCase()}.`
          : 'Я загадал один предмет. Спрашивай — я отвечу «да» или «нет».'}
      </p>

      {round.answer && !round.won && (
        <p className={styles.reply}>
          <span className={styles.replyQuestion}>{round.answer.text}</span>
          <b className={round.answer.yes ? styles.yes : styles.no}>
            {round.answer.yes ? 'Да' : 'Нет'}
          </b>
        </p>
      )}

      <ul className={styles.items}>
        {round.field.map((id) => {
          const out = round.excluded.includes(id)
          return (
            <li key={id}>
              <button
                className={out ? styles.itemOut : styles.item}
                onClick={() => guess(id)}
                disabled={out || round.won}
                title={ITEMS[id]?.title}
              >
                <img src={itemUrl(id)} alt={ITEMS[id]?.title ?? id} draggable={false} />
                <span>{ITEMS[id]?.title ?? id}</span>
              </button>
            </li>
          )
        })}
      </ul>

      {!round.won && (
        <>
          <p className={styles.counter}>
            Осталось <span className={styles.counterValue}>{left.length}</span> из{' '}
            {round.field.length}
          </p>

          <ul className={styles.questions}>
            {round.questions.map((question, index) => (
              <li key={question.prop}>
                <button
                  className={round.asked.includes(index) ? styles.askedOut : styles.ask}
                  onClick={() => ask(index)}
                  disabled={round.asked.includes(index)}
                >
                  {question.text}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </TaskFrame>
  )
}

function Summary({
  solved,
  total,
  onExit,
  onRestart,
}: {
  solved: number
  total: number
  onExit: () => void
  onRestart: () => void
}) {
  return (
    <div className={styles.summary}>
      <div className={styles.balloons} aria-hidden>
        {'🎈'.repeat(Math.max(1, solved))}
      </div>
      <h1 className={styles.summaryTitle}>Готово!</h1>
      <p className={styles.summaryText}>
        Ты отгадала {solved} из {total}.
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
