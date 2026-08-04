// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest"

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { HomePage } from "~/components/home-page"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
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
    const tagline = container.querySelector("[data-scroll-tagline]")
    expect(
      Array.from(
        tagline?.querySelectorAll(".scroll-tagline__line") ?? [],
        (line) => line.textContent,
      ),
    ).toEqual([
      "모든 대화를 명령 한 줄로.",
      "kmsg는 별도 서버 없이",
      "macOS 에서 직접 실행됩니다.",
    ])
    for (const label of [
      "macOS용 KakaoTalk CLI · MCP 서버",
      "메시지 워크플로우",
      "왜 kmsg인가",
      "코딩 에이전트",
      "주요 기능",
      "실사용 후기",
      "자주 묻는 질문",
      "설치",
    ]) {
      expect(screen.getByText(label)).toHaveClass("text-primary-readable")
    }
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
