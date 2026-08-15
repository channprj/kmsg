import { ExternalLink } from "lucide-react"

import { LanguageMenu } from "~/components/language-menu"
import { MobileNavigation } from "~/components/mobile-navigation"
import { ThemeToggle } from "~/components/theme-toggle"
import { buttonVariants } from "~/components/ui/button"
import { TooltipProvider } from "~/components/ui/tooltip"
import { LOCALES } from "~/content/locales"
import {
  localeTargets,
  publicRouteFor,
  type LocaleId,
  type PageKey,
} from "~/content/routes"
import { cn } from "~/lib/utils"

export function SiteHeader({
  locale,
  pageKey,
}: {
  locale: LocaleId
  pageKey: PageKey
}) {
  const ui = LOCALES[locale].ui
  const navigation = [
    { pageKey: "usage" as const, label: ui.usage },
    { pageKey: "architecture" as const, label: ui.architecture },
    { pageKey: "mcp" as const, label: "MCP" },
    { pageKey: "skill" as const, label: ui.skill },
  ]

  return (
    <TooltipProvider>
      <header className="site-header fixed inset-x-0 top-4 z-40 px-4">
        <div
          className="mx-auto flex h-14 max-w-5xl items-center gap-2 rounded-full border bg-background/92 px-2 shadow-sm backdrop-blur-xl sm:px-3"
          data-site-header-bar
        >
          <a
            aria-label="kmsg home"
            className="mr-auto flex min-h-11 items-center gap-2 rounded-xl px-2 font-semibold tracking-tight focus-visible:outline-2"
            href={publicRouteFor(locale, "home")}
          >
            <img
              alt=""
              className="size-8 rounded-lg"
              height="32"
              src="/kmsg/assets/brand/png/kmsg-app-icon-32.png"
              width="32"
            />
            <span translate="no">kmsg</span>
          </a>
          <nav
            aria-label={ui.navigation}
            className="hidden items-center gap-1 md:flex"
          >
            {navigation.map((item) => (
              <a
                aria-current={pageKey === item.pageKey ? "page" : undefined}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "min-h-10")}
                href={publicRouteFor(locale, item.pageKey)}
                key={item.pageKey}
              >
                {item.label}
              </a>
            ))}
            <a
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "min-h-10")}
              href="https://github.com/channprj/kmsg"
              rel="noopener noreferrer"
              target="_blank"
            >
              GitHub
              <ExternalLink aria-hidden="true" data-icon="inline-end" />
            </a>
          </nav>
          <div className="hidden md:block">
            <ThemeToggle locale={locale} />
          </div>
          <LanguageMenu
            locale={locale}
            pageKey={pageKey}
            targets={localeTargets(pageKey)}
          />
          <MobileNavigation locale={locale} />
        </div>
      </header>
    </TooltipProvider>
  )
}
