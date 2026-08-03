// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest"

import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { LanguageMenu } from "~/components/language-menu"
import { localeTargets } from "~/content/routes"

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
})

describe("LanguageMenu", () => {
  it("renders a grouped Shadcn radio menu without a native select", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <LanguageMenu
        locale="ko"
        pageKey="usage"
        targets={localeTargets("usage")}
      />,
    )

    expect(container.querySelector("select")).toBeNull()
    const trigger = screen.getByRole("button", {
      name: "언어 선택 · 한국어",
    })
    expect(trigger).toHaveAttribute("data-slot", "dropdown-menu-trigger")

    await user.click(trigger)

    expect(screen.getByText("언어 선택")).toBeVisible()
    expect(screen.getAllByRole("menuitemradio")).toHaveLength(4)
    expect(screen.getByRole("menuitemradio", { name: "한국어" })).toHaveAttribute(
      "aria-checked",
      "true",
    )
  })

  it("stores the locale and navigates to the same page", async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(
      <LanguageMenu
        locale="ko"
        pageKey="usage"
        targets={localeTargets("usage")}
        onNavigate={onNavigate}
      />,
    )

    await user.click(
      screen.getByRole("button", { name: "언어 선택 · 한국어" }),
    )
    await user.click(screen.getByRole("menuitemradio", { name: "English" }))

    expect(localStorage.getItem("kmsg-locale")).toBe("en")
    expect(onNavigate).toHaveBeenCalledWith("/kmsg/en/usage/")
  })

  it("still navigates when locale storage is unavailable", async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage disabled")
    })
    render(
      <LanguageMenu
        locale="jp"
        pageKey="mcp"
        targets={localeTargets("mcp")}
        onNavigate={onNavigate}
      />,
    )

    await user.click(
      screen.getByRole("button", { name: "言語を選択 · 日本語" }),
    )
    await user.click(screen.getByRole("menuitemradio", { name: "简体中文" }))

    expect(onNavigate).toHaveBeenCalledWith("/kmsg/cn/mcp/")
  })
})
