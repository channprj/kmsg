// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest"

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  formatDocumentDate,
  PageView,
} from "~/components/page-view"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("PageView", () => {
  it("preserves the source calendar date across runtime time zones", () => {
    expect(
      formatDocumentDate("ko", "2026-08-04T02:33:08+09:00"),
    ).toBe("2026년 8월 4일")
  })

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
      screen.getByRole("heading", { level: 1, name: "kmsg架构" }),
    ).toBeVisible()
    expect(
      screen.getByRole("navigation", { name: "本页内容: kmsg架构" }),
    ).toBeVisible()
    expect(
      screen.getByRole("navigation", { name: "主导航: kmsg架构" }),
    ).toBeVisible()
    expect(
      screen.getByRole("complementary", { name: "本页内容: kmsg架构" }),
    ).toBeVisible()
    expect(
      screen.getByRole("complementary", { name: "主导航: kmsg架构" }),
    ).toBeVisible()
    expect(screen.getByRole("heading", { level: 2, name: "设计决策" })).toBeVisible()
    expect(screen.getByRole("link", { name: "查看Markdown原文" })).toHaveAttribute(
      "href",
      "https://github.com/channprj/kmsg/blob/main/site/content/cn/architecture.md",
    )
  })
})
