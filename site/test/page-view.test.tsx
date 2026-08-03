// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest"

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { PageView } from "~/components/page-view"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("PageView", () => {
  it("selects the localized home route", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })))
    render(<PageView locale="en" pageKey="home" />)
    expect(
      screen.getByRole("heading", { level: 1, name: /KakaoTalk,\s+from your terminal/ }),
    ).toBeVisible()
  })

  it("renders legal copy from the preserved source", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })))
    render(<PageView locale="jp" pageKey="privacy" />)
    expect(screen.getByRole("heading", { level: 1, name: "プライバシー" })).toBeVisible()
    expect(screen.getByText(/アカウント、入力フォーム、解析サービス/)).toBeVisible()
  })

  it("renders a localized documentation shell", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })))
    render(<PageView locale="cn" pageKey="architecture" />)
    expect(
      screen.getByRole("heading", { level: 1, name: "kmsg架构 — macOS辅助功能自动化" }),
    ).toBeVisible()
  })
})
