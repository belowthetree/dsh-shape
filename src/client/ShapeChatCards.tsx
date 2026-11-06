/** Shape-owned cards mounted above the chat composer. */

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type { ShapeRequirement, ShapeResolverInjected } from '../capabilities.ts'
import { supportsShapeApiVersion } from '../capabilities.ts'
import css from './shape-chat-cards.module.css'

interface SlotDescriptor {
  slot: string
  title?: string
  text?: string
  button?: string
  greeting?: string
}

interface ShapeInfo {
  id: string
  title: string
  valid: boolean
  enabled?: boolean
  requirements?: ShapeRequirement[]
  shapeApiVersion?: number
  slotData?: SlotDescriptor[]
}

interface CardEntry {
  shape: ShapeInfo
  card: SlotDescriptor
}

const SLOT = 'conversation.input.dock'

/**
 * Read shape slot descriptors for the chat input dock.
 * @returns cards contributed by valid shapes.
 */
async function readCards(): Promise<CardEntry[]> {
  const response = await fetch('/dsh-shape/api/shapes', {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { accept: 'application/json' },
  })
  if (!response.ok) return []
  const payload = await response.json() as { ok?: boolean; shapes?: ShapeInfo[] }
  if (payload.ok !== true || !Array.isArray(payload.shapes)) return []

  const cards: CardEntry[] = []
  for (const shape of payload.shapes) {
    if (!shape.valid || shape.enabled === false) continue
    for (const card of shape.slotData ?? []) {
      if (card.slot === SLOT) cards.push({ shape, card })
    }
  }
  return cards
}

/**
 * Render descriptor-driven shape cards above the composer.
 * @param props.resolveShape - resolves declared capability requirements.
 * @returns the card list, or null when no shape contributes one.
 */
export function ShapeChatCards({ resolveShape }: ShapeResolverInjected) {
  const [cards, setCards] = useState<CardEntry[]>([])
  const [greetings, setGreetings] = useState<Record<string, string>>({})

  const load = useCallback(async (): Promise<void> => {
    try {
      const entries = await readCards()
      setCards(entries.filter(({ shape }) => (
        supportsShapeApiVersion(shape.shapeApiVersion)
        && resolveShape(shape.requirements ?? []).ok
      )))
    } catch {
      // A failed read leaves the composer clean; the shape browser still reports errors.
    }
  }, [resolveShape])

  useEffect(() => {
    void load()
    const reload = (): void => { void load() }
    window.addEventListener('dsh-shape:refresh', reload)
    window.addEventListener('dsh-shape:capabilities', reload)
    return () => {
      window.removeEventListener('dsh-shape:refresh', reload)
      window.removeEventListener('dsh-shape:capabilities', reload)
    }
  }, [load])

  if (cards.length === 0) return null

  return (
    <div className={css.list}>
      {cards.map(({ shape, card }, index) => {
        const key = `${shape.id}:${String(index)}`
        const greeting = greetings[key]
        return (
          <section
            className={css.card}
            key={key}
            data-testid="dsh-shape-chat-card"
            data-shape-id={shape.id}
          >
            <span className={css.mark} aria-hidden="true">
              <span className={css.markGrid}>
                <span /><span /><span /><span />
              </span>
            </span>
            <div className={css.body}>
              <div className={css.heading}>
                <h3 className={css.title}>{card.title ?? shape.title}</h3>
                <code className={css.id}>{shape.id}</code>
              </div>
              {card.text !== undefined && <p className={css.text}>{card.text}</p>}
              {greeting !== undefined && (
                <p className={css.greeting} role="status">{greeting}</p>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              data-testid="dsh-shape-chat-greet"
              onClick={() => {
                setGreetings(current => ({
                  ...current,
                  [key]: card.greeting ?? '你好！',
                }))
              }}
            >
              {card.button ?? '打个招呼'}
            </Button>
          </section>
        )
      })}
    </div>
  )
}
