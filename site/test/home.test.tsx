// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest"

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { HomePage } from "~/components/home-page"

const EXPECTED_MORE_STORIES_URL =
  "https://www.google.com/search?q=%22kmsg+%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%86%A1%22+OR+%22kmsg+%EC%B9%B4%ED%86%A1%22+OR+%22kmsg+%EC%B9%B4%EC%B9%B4%EC%98%A4%22"

afterEach(() => {
  cleanup()
  window.history.replaceState(null, "", "/")
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
    const installAction = screen.getByRole("link", { name: "설치하기" })
    const installTarget = container.querySelector("#install")

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
    expect(installAction).toHaveAttribute("href", "#install")
    expect(installTarget).toBeInTheDocument()
    expect(installTarget).toHaveAttribute("id", "install")
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

  it("keeps the fragment URL and scrolls the install target on activation", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })))
    const { container } = render(<HomePage locale="ko" />)
    const installTarget = container.querySelector<HTMLElement>("#install")
    const scrollIntoView = vi.fn()

    expect(installTarget).not.toBeNull()
    Object.assign(installTarget!, { scrollIntoView })

    fireEvent.click(screen.getByRole("link", { name: "설치하기" }))

    expect(window.location.hash).toBe("#install")
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" })
  })

  it("links whole featured cards and renders one centered discovery action", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })))
    const { container } = render(<HomePage locale="ko" />)
    const storyLinks = [
      ...container.querySelectorAll<HTMLAnchorElement>("[data-story-link]"),
    ]
    const discoveryLinks = screen.getAllByRole("link", {
      name: "더 많은 사례 보기",
    })

    expect(storyLinks.map((link) => link.href)).toEqual([
      "https://www.youtube.com/watch?v=_Pd1G33_R48&t=1020s",
      "https://www.youtube.com/watch?v=xz5fA7OyvQ0",
    ])
    expect(storyLinks[0]).toHaveAccessibleName(
      "Builder Josh 헤르메스 에이전트 5개로 뉴스 큐레이션부터 주식 매매까지 자동화한 방법",
    )
    expect(storyLinks[1]).toHaveAccessibleName(
      "Sam Hottman 나만의 Hermes 시스템 구축 방법",
    )
    for (const link of storyLinks) {
      expect(link).toHaveAttribute("target", "_blank")
      expect(link).toHaveAttribute("rel", "noopener noreferrer")
      expect(link.querySelector('[data-slot="card"]')).toBeInTheDocument()
      expect(link.querySelector("a, button, [role='button']")).toBeNull()
    }

    expect(discoveryLinks).toHaveLength(1)
    expect(discoveryLinks[0]).toHaveAttribute("data-story-search")
    expect(discoveryLinks[0]).toHaveAttribute(
      "href",
      EXPECTED_MORE_STORIES_URL,
    )
    expect(discoveryLinks[0]).toHaveAttribute("target", "_blank")
    expect(discoveryLinks[0]).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    )
    expect(discoveryLinks[0]?.parentElement).toHaveClass("justify-center")
  })

  it.each([
    ["ko", "더 많은 사례 보기"],
    ["en", "See more examples"],
    ["jp", "その他の活用事例を見る"],
    ["cn", "查看更多案例"],
  ] as const)(
    "renders one localized story discovery action for %s",
    (locale, label) => {
      vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })))
      render(<HomePage locale={locale} />)

      expect(screen.getAllByRole("link", { name: label })).toHaveLength(1)
    },
  )
})
