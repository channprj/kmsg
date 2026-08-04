// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest"

import { act, cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AnimatedTagline } from "~/components/animated-tagline"
import { HomePage } from "~/components/home-page"

const KOREAN_TAGLINE = [
  "모든 대화를 명령 한 줄로.",
  "kmsg는 별도 서버 없이",
  "macOS 에서 직접 실행됩니다.",
].join("\n")

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("animated product tagline", () => {
  it("preserves the exact Korean lines as ordered word spans", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })))

    const { container } = render(<HomePage locale="ko" />)
    const tagline = container.querySelector("[data-scroll-tagline]")
    const lines = [
      ...(tagline?.querySelectorAll(".scroll-tagline__line") ?? []),
    ]
    const words = [
      ...(tagline?.querySelectorAll(".scroll-tagline__word") ?? []),
    ]

    expect(lines.map((line) => line.textContent)).toEqual(
      KOREAN_TAGLINE.split("\n"),
    )
    expect(words.map((word) => word.textContent)).toEqual([
      "모든",
      "대화를",
      "명령",
      "한",
      "줄로.",
      "kmsg는",
      "별도",
      "서버",
      "없이",
      "macOS",
      "에서",
      "직접",
      "실행됩니다.",
    ])
    expect(tagline).toHaveTextContent(KOREAN_TAGLINE.replaceAll("\n", " "))
  })

  it("brightens and dims the words with viewport progress", () => {
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

    const { container } = render(<AnimatedTagline text={KOREAN_TAGLINE} />)
    const tagline = container.querySelector("[data-scroll-tagline]")
    const getWords = () => [
      ...container.querySelectorAll<HTMLElement>(".scroll-tagline__word"),
    ]

    flushFrames()
    expect(tagline).toHaveAttribute("data-scroll-progress", "0.0000")
    expect(getWords().every((word) => Number(word.style.opacity) === 0.22)).toBe(
      true,
    )

    top = 615
    act(() => window.dispatchEvent(new Event("scroll")))
    flushFrames()
    expect(tagline).toHaveAttribute("data-scroll-progress", "0.5000")
    expect(
      getWords()
        .slice(0, 6)
        .map((word) => Number(word.style.opacity)),
    ).toEqual([1, 1, 1, 1, 1, 1])
    expect(Number(getWords()[6]?.style.opacity)).toBeCloseTo(0.61)
    expect(
      getWords()
        .slice(7)
        .every((word) => Number(word.style.opacity) === 0.22),
    ).toBe(true)

    top = 380
    act(() => window.dispatchEvent(new Event("scroll")))
    flushFrames()
    expect(tagline).toHaveAttribute("data-scroll-progress", "1.0000")
    expect(getWords().every((word) => Number(word.style.opacity) === 1)).toBe(
      true,
    )

    top = 850
    act(() => window.dispatchEvent(new Event("scroll")))
    flushFrames()
    expect(tagline).toHaveAttribute("data-scroll-progress", "0.0000")
    expect(getWords().every((word) => Number(word.style.opacity) === 0.22)).toBe(
      true,
    )
    expect(tagline).not.toHaveAttribute("data-state")
  })

  it("shows every word immediately for reduced motion", () => {
    const requestFrame = vi.fn()
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })))
    vi.stubGlobal("requestAnimationFrame", requestFrame)

    const { container } = render(<AnimatedTagline text={KOREAN_TAGLINE} />)
    const tagline = container.querySelector("[data-scroll-tagline]")
    const words = [
      ...container.querySelectorAll<HTMLElement>(".scroll-tagline__word"),
    ]

    expect(tagline).toHaveAttribute("data-scroll-progress", "1.0000")
    expect(words.every((word) => Number(word.style.opacity) === 1)).toBe(true)
    expect(requestFrame).not.toHaveBeenCalled()
  })
})
