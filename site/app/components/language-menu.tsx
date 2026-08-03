import { ChevronDown, Globe2 } from "lucide-react"

import { Button } from "~/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { LOCALES } from "~/content/locales"
import {
  LOCALE_IDS,
  type LocaleId,
  type PageKey,
} from "~/content/routes"

export interface LanguageMenuProps {
  locale: LocaleId
  pageKey: PageKey
  targets: Record<LocaleId, string>
  onNavigate?: (target: string) => void
}

export function LanguageMenu({
  locale,
  pageKey,
  targets,
  onNavigate,
}: LanguageMenuProps) {
  const current = LOCALES[locale]
  const navigate =
    onNavigate ?? ((target: string) => window.location.assign(target))

  const selectLocale = (value: string) => {
    if (!LOCALE_IDS.includes(value as LocaleId)) return
    const nextLocale = value as LocaleId
    try {
      window.localStorage.setItem("kmsg-locale", nextLocale)
    } catch {
      // Storage may be disabled. Navigation remains available for this visit.
    }
    navigate(targets[nextLocale])
  }

  return (
    <div className="language-menu" data-page-key={pageKey}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={`${current.ui.language} · ${current.name}`}
            className="min-h-11 gap-2 rounded-full px-3"
            size="sm"
            variant="outline"
          >
            <Globe2 aria-hidden="true" data-icon="inline-start" />
            <span>{current.label}</span>
            <ChevronDown aria-hidden="true" data-icon="inline-end" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{current.ui.language}</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              onValueChange={selectLocale}
              value={locale}
            >
              {LOCALE_IDS.map((localeId) => (
                <DropdownMenuRadioItem
                  aria-label={LOCALES[localeId].name}
                  className="min-h-10"
                  key={localeId}
                  value={localeId}
                >
                  <span className="w-7 text-xs text-muted-foreground">
                    {LOCALES[localeId].label}
                  </span>
                  <span>{LOCALES[localeId].name}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <noscript>
        <span className="sr-only">{current.ui.language}</span>
        {LOCALE_IDS.map((localeId) => (
          <a href={targets[localeId]} key={localeId}>
            {LOCALES[localeId].name}
          </a>
        ))}
      </noscript>
    </div>
  )
}
