// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest"

import { act, cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { FooterWordmark } from "~/components/footer-wordmark"
import { SiteFooter } from "~/components/site-footer"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("FooterWordmark", () => {
  it("reveals four decorative letters once at the reference threshold", () => {
    let notify: IntersectionObserverCallback = () => undefined
    const observe = vi.fn()
    const disconnect = vi.fn()
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        root = null
        rootMargin = "0px"
        thresholds = [0.2]

        constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
          notify = callback
          expect(options).toEqual({ threshold: 0.2 })
        }

        observe = observe
        disconnect = disconnect
        unobserve = vi.fn()
        takeRecords = vi.fn(() => [])
      },
    )
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false })),
    )

    const { container } = render(<FooterWordmark />)
    const wordmark = container.querySelector("[data-footer-wordmark]")
    const letters = wordmark?.querySelectorAll("span") ?? []

    expect(wordmark).toHaveAttribute("aria-hidden", "true")
    expect(wordmark).toHaveAttribute("data-state", "hidden")
    expect(Array.from(letters, (letter) => letter.textContent).join(""))
      .toBe("kmsg")
    expect(letters).toHaveLength(4)
    expect(letters[3]).toHaveStyle({ "--letter-index": "3" })
    expect(observe).toHaveBeenCalledWith(wordmark)

    act(() => {
      notify([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
    })

    expect(wordmark).toHaveAttribute("data-state", "revealed")
    expect(disconnect).toHaveBeenCalledOnce()
  })

  it("renders the final cropped state immediately for reduced motion", () => {
    const observer = vi.fn()
    vi.stubGlobal("IntersectionObserver", observer)
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true })),
    )

    const { container } = render(<FooterWordmark />)

    expect(container.querySelector("[data-footer-wordmark]")).toHaveAttribute(
      "data-state",
      "revealed",
    )
    expect(observer).not.toHaveBeenCalled()
  })
})

describe("SiteFooter", () => {
  it("keeps an accessible brand and factual links above the decoration", () => {
    const { getByRole } = render(<SiteFooter locale="en" />)

    expect(getByRole("link", { name: "kmsg home" })).toHaveAttribute(
      "href",
      "/kmsg/en/",
    )
    expect(getByRole("link", { name: "MIT License" })).toHaveAttribute(
      "href",
      "https://github.com/channprj/kmsg/blob/main/LICENSE",
    )
    expect(getByRole("link", { name: "Privacy" })).toHaveAttribute(
      "href",
      "/kmsg/en/privacy/",
    )
  })
})
