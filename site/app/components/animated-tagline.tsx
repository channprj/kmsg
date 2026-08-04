import { Fragment } from "react"

import { calculateWordOpacity } from "~/lib/scroll-scrub"
import { useScrollScrubProgress } from "~/lib/use-scroll-scrub-progress"

export function AnimatedTagline({ text }: { text: string }) {
  const { elementRef, progress } =
    useScrollScrubProgress<HTMLParagraphElement>()
  const lines = text.split("\n").map((line) => line.split(" "))
  const wordCount = lines.reduce((count, words) => count + words.length, 0)
  let wordIndex = 0

  return (
    <p
      className="scroll-tagline mx-auto my-24 max-w-4xl text-center font-semibold leading-tight tracking-tight"
      data-scroll-progress={progress.toFixed(4)}
      data-scroll-tagline
      ref={elementRef}
    >
      {lines.map((words, lineIndex) => (
        <Fragment key={`${lineIndex}-${words.join(" ")}`}>
          <span className="scroll-tagline__line">
            {words.map((word, lineWordIndex) => {
              const currentWordIndex = wordIndex++

              return (
                <Fragment key={`${lineIndex}-${lineWordIndex}-${word}`}>
                  <span
                    className="scroll-tagline__word"
                    style={{
                      opacity: calculateWordOpacity(
                        progress,
                        currentWordIndex,
                        wordCount,
                      ),
                    }}
                  >
                    {word}
                  </span>
                  {lineWordIndex < words.length - 1 ? " " : null}
                </Fragment>
              )
            })}
          </span>
          {lineIndex < lines.length - 1 ? "\n" : null}
        </Fragment>
      ))}
    </p>
  )
}
