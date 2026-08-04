import { useEffect, useRef, useState } from "react"

import { calculateElementScrollProgress } from "~/lib/scroll-scrub"

export function useScrollScrubProgress<T extends Element>() {
  const elementRef = useRef<T>(null)
  const [progress, setProgress] = useState(1)

  useEffect(() => {
    const element = elementRef.current
    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches

    if (
      reduceMotion ||
      !element ||
      typeof window.requestAnimationFrame !== "function"
    ) {
      setProgress(1)
      return
    }

    let frameId: number | null = null
    const measure = () => {
      frameId = null
      setProgress(
        calculateElementScrollProgress(
          element.getBoundingClientRect(),
          window.innerHeight,
        ),
      )
    }
    const scheduleMeasure = () => {
      if (frameId === null) {
        frameId = window.requestAnimationFrame(measure)
      }
    }

    window.addEventListener("scroll", scheduleMeasure, { passive: true })
    window.addEventListener("resize", scheduleMeasure)
    scheduleMeasure()

    return () => {
      window.removeEventListener("scroll", scheduleMeasure)
      window.removeEventListener("resize", scheduleMeasure)
      if (
        frameId !== null &&
        typeof window.cancelAnimationFrame === "function"
      ) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [])

  return { elementRef, progress }
}
