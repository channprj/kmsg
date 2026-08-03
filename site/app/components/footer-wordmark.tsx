import { useEffect, useRef, useState, type CSSProperties } from "react"

const WORDMARK = Array.from("kmsg")

export function FooterWordmark() {
  const wordmarkRef = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches
    if (reduceMotion) {
      setRevealed(true)
      return
    }

    const wordmark = wordmarkRef.current
    if (!wordmark) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setRevealed(true)
        observer.disconnect()
      },
      { threshold: 0.2 },
    )
    observer.observe(wordmark)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      aria-hidden="true"
      className="footer-wordmark"
      data-footer-wordmark
      data-state={revealed ? "revealed" : "hidden"}
      ref={wordmarkRef}
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
