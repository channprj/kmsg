// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest"

import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { SiteHeader } from "~/components/site-header"
import { ThemeToggle } from "~/components/theme-toggle"
import { TooltipProvider } from "~/components/ui/tooltip"
import { THEME_BOOTSTRAP } from "~/lib/theme"

afterEach(() => {
  cleanup()
  localStorage.clear()
  document.documentElement.className = "dark"
  document.documentElement.dataset.theme = "dark"
  vi.restoreAllMocks()
})

describe("shared Shadcn shell", () => {
  it("uses a compact centered global navigation bar", () => {
    const { container } = render(<SiteHeader locale="ko" pageKey="home" />)
    const header = screen.getByRole("banner")
    const navigationBar = container.querySelector("[data-site-header-bar]")

    expect(header).toHaveClass("top-4", "px-4")
    expect(navigationBar).toHaveClass(
      "h-14",
      "max-w-5xl",
      "rounded-full",
      "shadow-sm",
    )
  })

  it("opens mobile navigation in a titled Sheet", async () => {
    const user = userEvent.setup()
    render(<SiteHeader locale="en" pageKey="home" />)

    expect(screen.getByRole("link", { name: "kmsg home" })).toBeVisible()
    await user.click(screen.getByRole("button", { name: "Open menu" }))

    expect(screen.getByRole("dialog")).toHaveAttribute("data-slot", "sheet-content")
    expect(screen.getByRole("heading", { name: "Primary navigation" })).toBeVisible()
    expect(screen.getByRole("link", { name: "Usage" })).toHaveAttribute(
      "href",
      "/kmsg/en/usage/",
    )
  })

  it("toggles and persists the paper theme", async () => {
    const user = userEvent.setup()
    render(
      <TooltipProvider>
        <ThemeToggle locale="ko" />
      </TooltipProvider>,
    )

    await user.click(screen.getByRole("button", { name: "밝은 테마로 전환" }))

    expect(document.documentElement).not.toHaveClass("dark")
    expect(document.documentElement).toHaveAttribute("data-theme", "paper")
    expect(localStorage.getItem("kmsg-theme")).toBe("paper")
    expect(screen.getByRole("button", { name: "어두운 테마로 전환" })).toBeVisible()
  })

  it("defaults to dark before paint when no theme is stored", () => {
    document.head.innerHTML = '<meta name="theme-color" content="#f7f5ed">'
    document.documentElement.className = ""
    document.documentElement.dataset.theme = "paper"
    localStorage.clear()

    window.eval(THEME_BOOTSTRAP)

    expect(document.documentElement).toHaveClass("dark")
    expect(document.documentElement).toHaveAttribute("data-theme", "dark")
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute(
      "content",
      "#131209",
    )
  })

  it("restores the stored theme before a new page paints", () => {
    document.head.innerHTML = '<meta name="theme-color" content="#131209">'
    localStorage.setItem("kmsg-theme", "paper")

    window.eval(THEME_BOOTSTRAP)

    expect(document.documentElement).not.toHaveClass("dark")
    expect(document.documentElement).toHaveAttribute("data-theme", "paper")
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute(
      "content",
      "#f7f5ed",
    )
  })

  it("changes theme even when storage is disabled", async () => {
    const user = userEvent.setup()
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage disabled")
    })
    render(
      <TooltipProvider>
        <ThemeToggle locale="cn" />
      </TooltipProvider>,
    )

    await user.click(screen.getByRole("button", { name: "切换到浅色主题" }))
    expect(document.documentElement).toHaveAttribute("data-theme", "paper")
  })
})
