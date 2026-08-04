import type { CSSProperties } from "react"

import { useReplayableReveal } from "~/lib/use-replayable-reveal"

const WORDMARK = Array.from("kmsg")

export function FooterWordmark() {
  const { elementRef, state } = useReplayableReveal<HTMLDivElement>()

  return (
    <div
      aria-hidden="true"
      className="footer-wordmark"
      data-footer-wordmark
      data-state={state}
      ref={elementRef}
    >
      {WORDMARK.map((letter, index) => (
        <span
          key={`${letter}-${index}`}
          style={{ "--letter-index": index } as CSSProperties}
        >
          {letter}
        </span>
      ))}
    </div>
  )
}
