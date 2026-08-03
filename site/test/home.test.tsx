// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest"

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { HomePage } from "~/components/home-page"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("localized React home", () => {
  it("composes the Korean product story from real Shadcn components", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true })),
    )
    const { container } = render(<HomePage locale="ko" />)

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /카카오톡을\s+AI Native 하게 사용하세요/,
      }),
    ).toBeVisible()
    expect(container.querySelectorAll('[data-slot="card"]').length).toBeGreaterThanOrEqual(8)
    expect(container.querySelectorAll('[data-slot="badge"]').length).toBeGreaterThanOrEqual(8)
    expect(container.querySelectorAll('[data-slot="accordion-item"]')).toHaveLength(6)
    expect(screen.getByText("kmsg chats --json")).toBeVisible()
    expect(screen.getAllByText('kmsg read "AI 프로젝트" --limit 20 --json').length).toBeGreaterThan(0)
    expect(screen.getAllByText('kmsg send "AI 프로젝트" "확인했어요." --dry-run').length).toBeGreaterThan(0)
    expect(container.querySelector("select")).toBeNull()
    expect(container.querySelector("[data-footer-wordmark]")).toBeInTheDocument()
  })

  it("renders source-accurate localized FAQ counts", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true })),
    )
    const { container, rerender } = render(<HomePage locale="en" />)
    expect(container.querySelectorAll('[data-slot="accordion-item"]')).toHaveLength(6)

    rerender(<HomePage locale="jp" />)
    expect(container.querySelectorAll('[data-slot="accordion-item"]')).toHaveLength(4)

    rerender(<HomePage locale="cn" />)
    expect(container.querySelectorAll('[data-slot="accordion-item"]')).toHaveLength(4)
  })
})
