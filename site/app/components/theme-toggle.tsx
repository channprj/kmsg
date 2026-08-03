import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "~/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip"
import { LOCALES } from "~/content/locales"
import type { LocaleId } from "~/content/routes"

export function ThemeToggle({ locale }: { locale: LocaleId }) {
  const [theme, setTheme] = useState<"dark" | "paper">("dark")
  const ui = LOCALES[locale].ui

  useEffect(() => {
    setTheme(
      document.documentElement.dataset.theme === "paper" ? "paper" : "dark",
    )
  }, [])

  const label = theme === "dark" ? ui.lightTheme : ui.darkTheme

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "paper" : "dark"
    const root = document.documentElement
    root.classList.toggle("dark", nextTheme === "dark")
    root.dataset.theme = nextTheme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", nextTheme === "dark" ? "#131209" : "#f7f5ed")
    try {
      window.localStorage.setItem("kmsg-theme", nextTheme)
    } catch {
      // A storage failure must not prevent changing the current page.
    }
    setTheme(nextTheme)
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          className="min-h-11 min-w-11 rounded-full"
          onClick={toggleTheme}
          size="icon"
          variant="ghost"
        >
          {theme === "dark" ? (
            <Sun aria-hidden="true" />
          ) : (
            <Moon aria-hidden="true" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
