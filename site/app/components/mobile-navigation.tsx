import { Menu } from "lucide-react"

import { ThemeToggle } from "~/components/theme-toggle"
import { Button, buttonVariants } from "~/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet"
import { LOCALES } from "~/content/locales"
import { pageCopyFor } from "~/content/pages"
import { publicRouteFor, type LocaleId } from "~/content/routes"
import { cn } from "~/lib/utils"

export function MobileNavigation({ locale }: { locale: LocaleId }) {
  const ui = LOCALES[locale].ui

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          aria-label={ui.menuOpen}
          className="min-h-11 min-w-11 rounded-full md:hidden"
          size="icon"
          variant="ghost"
        >
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[min(88vw,24rem)]" side="right">
        <SheetHeader>
          <SheetTitle>{ui.navigation}</SheetTitle>
          <SheetDescription>{ui.footerTagline}</SheetDescription>
        </SheetHeader>
        <nav aria-label={ui.navigation} className="flex flex-col gap-2 px-4">
          <a
            className={cn(buttonVariants({ variant: "ghost" }), "min-h-11 justify-start")}
            href={publicRouteFor(locale, "usage")}
          >
            {ui.usage}
          </a>
          <a
            className={cn(buttonVariants({ variant: "ghost" }), "min-h-11 justify-start")}
            href={publicRouteFor(locale, "architecture")}
          >
            {ui.architecture}
          </a>
          <a
            className={cn(buttonVariants({ variant: "ghost" }), "min-h-11 justify-start")}
            href={publicRouteFor(locale, "mcp")}
          >
            MCP
          </a>
          <a
            className={cn(buttonVariants({ variant: "ghost" }), "min-h-11 justify-start")}
            href={publicRouteFor(locale, "skill")}
          >
            {ui.skill}
          </a>
          <a
            className={cn(buttonVariants({ variant: "ghost" }), "min-h-11 justify-start")}
            href={publicRouteFor(locale, "developers")}
          >
            {pageCopyFor(locale, "developers").eyebrow}
          </a>
        </nav>
        <div className="mt-auto flex items-center justify-between border-t p-4">
          <span className="text-sm text-muted-foreground">{ui.footerTagline}</span>
          <ThemeToggle locale={locale} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
