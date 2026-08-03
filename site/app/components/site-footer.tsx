import { ExternalLink } from "lucide-react"

import { FooterWordmark } from "~/components/footer-wordmark"
import { LOCALES } from "~/content/locales"
import { publicRouteFor, type LocaleId } from "~/content/routes"

export function SiteFooter({ locale }: { locale: LocaleId }) {
  const ui = LOCALES[locale].ui

  return (
    <footer className="mt-28 overflow-hidden border-t pt-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <a
            aria-label="kmsg home"
            className="inline-flex min-h-11 items-center text-lg font-semibold tracking-tight"
            href={publicRouteFor(locale, "home")}
          >
            kmsg
          </a>
          <p className="max-w-md text-sm text-muted-foreground">
            {ui.footerTagline}
            <br />
            {ui.footerDisclaimer}
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Footer">
          <a className="min-h-11 py-3 hover:underline" href={publicRouteFor(locale, "privacy")}>
            {ui.privacy}
          </a>
          <a className="min-h-11 py-3 hover:underline" href={publicRouteFor(locale, "terms")}>
            {ui.terms}
          </a>
          <a
            className="inline-flex min-h-11 items-center gap-1 hover:underline"
            href="https://github.com/channprj/kmsg/blob/main/LICENSE"
          >
            MIT License
            <ExternalLink aria-hidden="true" className="size-3.5" />
          </a>
          <a
            className="inline-flex min-h-11 items-center gap-1 hover:underline"
            href="https://github.com/channprj/kmsg"
          >
            GitHub
            <ExternalLink aria-hidden="true" className="size-3.5" />
          </a>
        </nav>
      </div>
      <div className="mt-12" translate="no">
        <FooterWordmark />
      </div>
    </footer>
  )
}
