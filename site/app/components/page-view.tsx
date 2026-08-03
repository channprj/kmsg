import { ExternalLink } from "lucide-react"
import type { MouseEvent as ReactMouseEvent } from "react"

import { copyTextToClipboard } from "~/components/copy-button"
import { HomePage } from "~/components/home-page"
import { SiteFooter } from "~/components/site-footer"
import { SiteHeader } from "~/components/site-header"
import { Badge } from "~/components/ui/badge"
import { Card, CardContent } from "~/components/ui/card"
import { Separator } from "~/components/ui/separator"
import { documentFor, type DocumentPageKey } from "~/content/documents"
import { LEGAL_CONTENT } from "~/content/legal"
import { LOCALES } from "~/content/locales"
import { pageCopyFor } from "~/content/pages"
import {
  PAGE_KEYS,
  publicRouteFor,
  type LocaleId,
  type PageKey,
} from "~/content/routes"

function LegalPage({
  locale,
  pageKey,
}: {
  locale: LocaleId
  pageKey: "privacy" | "terms"
}) {
  const copy = LEGAL_CONTENT[locale][pageKey]
  return (
    <>
      <SiteHeader locale={locale} pageKey={pageKey} />
      <main className="mx-auto min-h-[75svh] max-w-4xl px-6 pb-24 pt-36">
        <Badge variant="secondary">{copy.eyebrow}</Badge>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-6xl">
          {copy.heading}
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
          {copy.intro}
        </p>
        <div className="mt-12 grid gap-4">
          {copy.sections.map((section) => (
            <Card key={section.title}>
              <CardContent className="py-6">
                <h2 className="text-xl font-semibold">{section.title}</h2>
                <p className="mt-3 leading-7 text-muted-foreground">{section.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  )
}

function DocumentShell({
  locale,
  pageKey,
}: {
  locale: LocaleId
  pageKey: DocumentPageKey
}) {
  const copy = pageCopyFor(locale, pageKey)
  const content = documentFor(locale, pageKey)
  const ui = LOCALES[locale].ui
  const documentation = PAGE_KEYS.filter(
    (key): key is DocumentPageKey =>
      !["home", "privacy", "terms"].includes(key),
  )
  const sourceUrl = `https://github.com/channprj/kmsg/blob/main/${content.source}`
  const updated = new Intl.DateTimeFormat(LOCALES[locale].dateLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(content.lastModified))

  const copyCode = async (event: ReactMouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    const button = target.closest<HTMLButtonElement>("[data-code-copy]")
    if (!button) return
    const code = button.parentElement?.querySelector("code")?.textContent ?? ""
    const copied = await copyTextToClipboard(code)
    const label = copied
      ? button.dataset.copiedLabel
      : button.dataset.copyFailedLabel
    const labelNode = button.querySelector<HTMLElement>("[data-copy-label]")
    if (label && labelNode) labelNode.textContent = label
    button.setAttribute("aria-label", label ?? ui.copy)
    window.setTimeout(() => {
      if (labelNode) labelNode.textContent = ui.copy
      button.setAttribute("aria-label", ui.copy)
    }, 1600)
  }

  return (
    <>
      <SiteHeader locale={locale} pageKey={pageKey} />
      <main className="mx-auto grid min-h-[75svh] max-w-7xl gap-10 px-4 pb-24 pt-32 sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)_13rem] lg:gap-8">
        <aside className="hidden lg:block">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {ui.navigation}
          </p>
          <nav aria-label={ui.navigation} className="sticky top-28 flex flex-col gap-1">
            {documentation.map((key) => (
              <a
                aria-current={key === pageKey ? "page" : undefined}
                className="rounded-lg px-3 py-2 text-sm hover:bg-muted aria-[current=page]:bg-muted aria-[current=page]:font-medium"
                href={publicRouteFor(locale, key)}
                key={key}
              >
                {pageCopyFor(locale, key).eyebrow}
              </a>
            ))}
          </nav>
        </aside>
        <article className="min-w-0">
          <header className="mb-12 border-b pb-10">
            <Badge variant="secondary">{copy.eyebrow}</Badge>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              {content.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
              {copy.description}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
              <span>{ui.pipeline}</span>
              <Separator className="h-4" orientation="vertical" />
              <span>{ui.updated} {updated}</span>
              <Separator className="h-4" orientation="vertical" />
              <a className="inline-flex items-center gap-1 hover:text-foreground" href={sourceUrl} rel="noopener noreferrer" target="_blank">
                {ui.edit}
                <ExternalLink aria-hidden="true" className="size-4" />
              </a>
            </div>
          </header>
          <div
            className="markdown-body"
            dangerouslySetInnerHTML={{ __html: content.html }}
            onClick={copyCode}
          />
        </article>
        <aside className="hidden xl:block">
          <nav aria-label={ui.toc} className="sticky top-28">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {ui.toc}
            </p>
            <ol className="space-y-1 border-l pl-3">
              {content.headings
                .filter(({ level }) => level === 2)
                .map((heading) => (
                  <li key={heading.id}>
                    <a className="block rounded-md py-1.5 text-sm leading-5 text-muted-foreground hover:text-foreground" href={`#${heading.id}`}>
                      {heading.label}
                    </a>
                  </li>
                ))}
            </ol>
            <a className="mt-5 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" href={sourceUrl} rel="noopener noreferrer" target="_blank">
              {ui.source}
              <ExternalLink aria-hidden="true" className="size-4" />
            </a>
          </nav>
        </aside>
      </main>
      <SiteFooter locale={locale} />
    </>
  )
}

export function PageView({
  locale,
  pageKey,
}: {
  locale: LocaleId
  pageKey: PageKey
}) {
  if (pageKey === "home") return <HomePage locale={locale} />
  if (pageKey === "privacy" || pageKey === "terms") {
    return <LegalPage locale={locale} pageKey={pageKey} />
  }
  return <DocumentShell locale={locale} pageKey={pageKey} />
}
