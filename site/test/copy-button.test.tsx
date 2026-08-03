// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest"

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { CopyButton } from "~/components/copy-button"

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe("CopyButton", () => {
  it("copies with the Clipboard API and restores its idle label", async () => {
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    })
    render(
      <CopyButton
        copiedLabel="Copied"
        failedLabel="Copy failed"
        idleLabel="Copy command"
        text="brew install channprj/tap/kmsg"
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Copy command" }))
    await act(async () => Promise.resolve())
    expect(writeText).toHaveBeenCalledWith("brew install channprj/tap/kmsg")
    expect(screen.getByRole("button", { name: "Copied" })).toBeVisible()

    act(() => vi.advanceTimersByTime(1600))
    expect(screen.getByRole("button", { name: "Copy command" })).toBeVisible()
  })

  it("uses the textarea fallback when Clipboard API rejects", async () => {
    const user = userEvent.setup()
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    })
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: vi.fn(() => true),
    })
    render(
      <CopyButton
        copiedLabel="복사됨"
        failedLabel="복사 실패"
        idleLabel="명령 복사"
        text="kmsg status"
      />,
    )

    await user.click(screen.getByRole("button", { name: "명령 복사" }))
    expect(document.execCommand).toHaveBeenCalledWith("copy")
    expect(screen.getByRole("button", { name: "복사됨" })).toBeVisible()
    expect(document.querySelector("textarea")).toBeNull()
  })

  it("announces failure when both copy paths fail", async () => {
    const user = userEvent.setup()
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    })
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: vi.fn(() => false),
    })
    render(
      <CopyButton
        copiedLabel="Copied"
        failedLabel="Copy failed"
        idleLabel="Copy"
        text="kmsg status"
      />,
    )

    await user.click(screen.getByRole("button", { name: "Copy" }))
    expect(screen.getByRole("button", { name: "Copy failed" })).toBeVisible()
  })
})
