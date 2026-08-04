// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest"

import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  calculateElementScrollProgress,
  calculateWordOpacity,
  clampScrollProgress,
} from "~/lib/scroll-scrub"
import { useScrollScrubProgress } from "~/lib/use-scroll-scrub-progress"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("scroll scrub math", () => {
  it("maps start 0.85 to end 0.5 and clamps outside the range", () => {
    const viewportHeight = 1_000
    const height = 120

    expect(
      calculateElementScrollProgress({ top: 850, height }, viewportHeight),
    ).toBe(0)
    expect(
      calculateElementScrollProgress({ top: 615, height }, viewportHeight),
    ).toBeCloseTo(0.5)
    expect(
      calculateElementScrollProgress({ top: 380, height }, viewportHeight),
    ).toBe(1)
    expect(
      calculateElementScrollProgress({ top: 1_000, height }, viewportHeight),
    ).toBe(0)
    expect(
      calculateElementScrollProgress({ top: 100, height }, viewportHeight),
    ).toBe(1)
  })

  it("fails open for invalid geometry", () => {
    expect(
      calculateElementScrollProgress(
        { top: Number.NaN, height: 120 },
        1_000,
      ),
    ).toBe(1)
    expect(
      calculateElementScrollProgress({ top: 850, height: -1 }, 1_000),
    ).toBe(1)
    expect(
      calculateElementScrollProgress({ top: 850, height: 120 }, 0),
    ).toBe(1)
  })

  it("brightens equal word ranges from 0.22 to 1", () => {
    expect(clampScrollProgress(-1)).toBe(0)
    expect(clampScrollProgress(2)).toBe(1)
    expect(calculateWordOpacity(0, 0, 4)).toBe(0.22)
    expect(calculateWordOpacity(0.125, 0, 4)).toBeCloseTo(0.61)
    expect(calculateWordOpacity(0.25, 0, 4)).toBe(1)
    expect(calculateWordOpacity(0.25, 1, 4)).toBe(0.22)
    expect(calculateWordOpacity(1, 3, 4)).toBe(1)
  })

  it("fails open for invalid word ranges", () => {
    expect(calculateWordOpacity(Number.NaN, 0, 4)).toBe(1)
    expect(calculateWordOpacity(0.5, -1, 4)).toBe(1)
    expect(calculateWordOpacity(0.5, 4, 4)).toBe(1)
    expect(calculateWordOpacity(0.5, 0, 0)).toBe(1)
  })
})

function ProgressHarness() {
  const { elementRef, progress } = useScrollScrubProgress<HTMLDivElement>()
  return <div ref={elementRef} data-progress={progress} data-testid="target" />
}

describe("useScrollScrubProgress", () => {
  it("updates in both directions through one queued frame", () => {
    let top = 850
    let nextFrame = 1
    const frames = new Map<number, FrameRequestCallback>()
    const requestFrame = vi.fn((callback: FrameRequestCallback) => {
      const id = nextFrame++
      frames.set(id, callback)
      return id
    })
    const flushFrames = () => {
      const pending = [...frames.values()]
      frames.clear()
      act(() => pending.forEach((callback) => callback(0)))
    }

    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })))
    vi.stubGlobal("requestAnimationFrame", requestFrame)
    vi.stubGlobal(
      "cancelAnimationFrame",
      vi.fn((id: number) => frames.delete(id)),
    )
    vi.stubGlobal("innerHeight", 1_000)
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
      () => ({ top, bottom: top + 120, height: 120 }) as DOMRect,
    )
    const addEvent = vi.spyOn(window, "addEventListener")

    render(<ProgressHarness />)
    flushFrames()
    expect(screen.getByTestId("target")).toHaveAttribute("data-progress", "0")
    expect(addEvent).toHaveBeenCalledWith("scroll", expect.any(Function), {
      passive: true,
    })

    top = 380
    act(() => {
      window.dispatchEvent(new Event("scroll"))
      window.dispatchEvent(new Event("scroll"))
    })
    expect(frames.size).toBe(1)
    flushFrames()
    expect(screen.getByTestId("target")).toHaveAttribute("data-progress", "1")

    top = 850
    act(() => window.dispatchEvent(new Event("scroll")))
    flushFrames()
    expect(screen.getByTestId("target")).toHaveAttribute("data-progress", "0")
  })

  it("stays fully visible for reduced motion", () => {
    const requestFrame = vi.fn()
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })))
    vi.stubGlobal("requestAnimationFrame", requestFrame)

    render(<ProgressHarness />)

    expect(screen.getByTestId("target")).toHaveAttribute("data-progress", "1")
    expect(requestFrame).not.toHaveBeenCalled()
  })

  it("stays fully visible when animation frames are unavailable", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })))
    vi.stubGlobal("requestAnimationFrame", undefined)

    render(<ProgressHarness />)

    expect(screen.getByTestId("target")).toHaveAttribute("data-progress", "1")
  })

  it("cancels a pending frame and removes listeners on unmount", () => {
    const requestFrame = vi.fn(() => 17)
    const cancelFrame = vi.fn()
    const removeEvent = vi.spyOn(window, "removeEventListener")
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })))
    vi.stubGlobal("requestAnimationFrame", requestFrame)
    vi.stubGlobal("cancelAnimationFrame", cancelFrame)

    const { unmount } = render(<ProgressHarness />)
    unmount()

    expect(cancelFrame).toHaveBeenCalledWith(17)
    expect(removeEvent).toHaveBeenCalledWith("scroll", expect.any(Function))
    expect(removeEvent).toHaveBeenCalledWith("resize", expect.any(Function))
  })
})
