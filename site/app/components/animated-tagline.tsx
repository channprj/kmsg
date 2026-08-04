import type { CSSProperties } from "react"

import { useReplayableReveal } from "~/lib/use-replayable-reveal"

export function AnimatedTagline({ text }: { text: string }) {
  const { elementRef, state } = useReplayableReveal<HTMLParagraphElement>()

  return (
    <p
      className="scroll-tagline mx-auto my-24 max-w-4xl text-center font-semibold leading-tight tracking-tight"
      data-scroll-tagline
      data-state={state}
      ref={elementRef}
    >
      {text.split("\n").map((line, index) => (
        <span
          key={`${index}-${line}`}
          style={{ "--line-index": index } as CSSProperties}
        >
          {line}
        </span>
      ))}
    </p>
  )
}
