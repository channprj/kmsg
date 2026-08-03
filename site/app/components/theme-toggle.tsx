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
import {
  applyThemeToDocument,
  readThemeFromDocument,
  THEME_STORAGE_KEY,
  type SiteTheme,
} from "~/lib/theme"

export function ThemeToggle({ locale }: { locale: LocaleId }) {
  const [theme, setTheme] = useState<SiteTheme>("dark")
  const ui = LOCALES[locale].ui

  useEffect(() => {
    setTheme(readThemeFromDocument())
  }, [])

  const label = theme === "dark" ? ui.lightTheme : ui.darkTheme

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "paper" : "dark"
    applyThemeToDocument(nextTheme)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
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
