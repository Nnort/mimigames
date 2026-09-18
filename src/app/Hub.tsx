import { useState } from 'react'

import {
  LOCATIONS,
  backgroundUrl,
  packsForLocation,
  spriteUrl,
  type LocationInfo,
} from '../core/content'
import { useProgress } from '../core/progress'
import { speak } from '../core/speech'
import type { LocationId } from '../core/types'
import styles from './Hub.module.css'

interface Props {
  onOpenPack: (packId: string) => void
  onOpenSettings: () => void
  onOpenParent: () => void
}

export function Hub({ onOpenPack, onOpenSettings, onOpenParent }: Props) {
  const { progress } = useProgress()
  const [open, setOpen] = useState<LocationId | null>(null)
  const location = LOCATIONS.find((l) => l.id === open) ?? null

  return (
    <div className={styles.hub}>
      <header className={styles.top}>
        <div className={styles.balloons} title="Собранные шарики">
          <span aria-hidden>🎈</span> {progress.balloons}
        </div>
        <div className={styles.topButtons}>
          <button className={styles.ghost} onClick={onOpenSettings}>
            Настройки
          </button>
          {/* Неприметная кнопка для мамы, см. PLAN.md §11. */}
          <button className={styles.quiet} onClick={onOpenParent} title="Для взрослых">
            ···
          </button>
        </div>
      </header>

      {location === null ? (
        <>
          <div className={styles.greeting}>
            <img
              className={styles.vera}
              src={spriteUrl('vera', 'happy')}
              alt=""
              draggable={false}
            />
            <h1 className={styles.title}>Куда пойдём?</h1>
          </div>

          <ul className={styles.map}>
            {LOCATIONS.map((l) => (
              <LocationCard
                key={l.id}
                location={l}
                count={packsForLocation(l.id).length}
                onOpen={() => setOpen(l.id)}
              />
            ))}
          </ul>
        </>
      ) : (
        <LocationScreen
          location={location}
          doneIds={progress.done}
          onBack={() => setOpen(null)}
          onOpenPack={onOpenPack}
        />
      )}
    </div>
  )
}

function LocationCard({
  location,
  count,
  onOpen,
}: {
  location: LocationInfo
  count: number
  onOpen: () => void
}) {
  const empty = count === 0
  return (
    <li>
      <button
        className={styles.card}
        style={{ '--tint': location.tint } as React.CSSProperties}
        onClick={onOpen}
        disabled={empty}
      >
        <span
          className={styles.cardArt}
          style={
            location.art
              ? { backgroundImage: `url(${backgroundUrl(location.id)})` }
              : undefined
          }
        />
        <span className={styles.cardName}>{location.title}</span>
        <span className={styles.cardCount}>
          {empty ? 'скоро' : `${count} ${plural(count, 'игра', 'игры', 'игр')}`}
        </span>
      </button>
    </li>
  )
}

function LocationScreen({
  location,
  doneIds,
  onBack,
  onOpenPack,
}: {
  location: LocationInfo
  doneIds: string[]
  onBack: () => void
  onOpenPack: (packId: string) => void
}) {
  const packs = packsForLocation(location.id)

  return (
    <section className={styles.location}>
      <button className={styles.back} onClick={onBack}>
        ← На карту
      </button>
      <h1 className={styles.title}>{location.title}</h1>

      <ul className={styles.packs}>
        {packs.map((pack) => (
          <li key={pack.id}>
            <button className={styles.pack} onClick={() => onOpenPack(pack.id)}>
              <img
                className={styles.packFace}
                src={spriteUrl(pack.character, 'happy')}
                alt=""
                draggable={false}
              />
              <span className={styles.packText}>
                <span className={styles.packTitle}>{pack.title}</span>
                <span className={styles.packMeta}>
                  {pack.items.length} {plural(pack.items.length, 'шаг', 'шага', 'шагов')}
                  {doneIds.includes(pack.id) && ' · пройдено'}
                </span>
              </span>
              <span
                className={styles.packSpeak}
                role="button"
                tabIndex={0}
                title="Прочитать вслух"
                onClick={(e) => {
                  e.stopPropagation()
                  speak(pack.title)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation()
                    e.preventDefault()
                    speak(pack.title)
                  }
                }}
              >
                🔊
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}
