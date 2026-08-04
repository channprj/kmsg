import { useEffect, useRef, useState } from "react"

export type RevealState = "hidden" | "revealed"

export function useReplayableReveal<T extends Element>(threshold = 0.2) {
  const elementRef = useRef<T>(null)
  const [state, setState] = useState<RevealState>("hidden")

  useEffect(() => {
    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches
    const element = elementRef.current

    if (reduceMotion || typeof IntersectionObserver !== "function") {
      setState("revealed")
      return
    }
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        setState(entry.isIntersecting ? "revealed" : "hidden")
      },
      { threshold },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [threshold])

  return { elementRef, state }
}
