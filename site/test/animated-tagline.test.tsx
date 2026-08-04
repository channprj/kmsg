// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest"

import { act, cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { HomePage } from "~/components/home-page"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("animated product tagline", () => {
  it("replays the exact Korean lines whenever the tagline re-enters", () => {
    const callbacks = new Map<Element, IntersectionObserverCallback>()
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        root = null
        rootMargin = "0px"
        thresholds = [0.2]

        constructor(
          private callback: IntersectionObserverCallback,
          options?: IntersectionObserverInit,
        ) {
          expect(options).toEqual({ threshold: 0.2 })
        }

        observe = (target: Element) => callbacks.set(target, this.callback)
        disconnect = vi.fn()
        unobserve = vi.fn()
        takeRecords = vi.fn(() => [])
      },
    )
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false })),
    )

    const { container } = render(<HomePage locale="ko" />)
    const tagline = container.querySelector("[data-scroll-tagline]")
    const lines = tagline?.querySelectorAll("span") ?? []

    expect(tagline).toHaveAttribute("data-state", "hidden")
    expect(Array.from(lines, (line) => line.textContent)).toEqual([
      "모든 대화를 명령 한 줄로.",
      "kmsg는 별도 서버 없이",
      "macOS 에서 직접 실행됩니다.",
    ])
    expect(lines[2]).toHaveStyle({ "--line-index": "2" })

    const notify = (isIntersecting: boolean) => {
      const callback = tagline ? callbacks.get(tagline) : undefined
      act(() => {
        callback?.(
          [{ isIntersecting, target: tagline } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        )
      })
    }

    notify(true)
    expect(tagline).toHaveAttribute("data-state", "revealed")
    notify(false)
    expect(tagline).toHaveAttribute("data-state", "hidden")
    notify(true)
    expect(tagline).toHaveAttribute("data-state", "revealed")
  })

  it("shows every tagline line immediately for reduced motion", () => {
    const observer = vi.fn()
    vi.stubGlobal("IntersectionObserver", observer)
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true })),
    )

    const { container } = render(<HomePage locale="ko" />)

    expect(container.querySelector("[data-scroll-tagline]")).toHaveAttribute(
      "data-state",
      "revealed",
    )
    expect(observer).not.toHaveBeenCalled()
  })
})
