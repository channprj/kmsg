import { HomePage } from "~/components/home-page"
import { SiteFooter } from "~/components/site-footer"
import { SiteHeader } from "~/components/site-header"
import { Badge } from "~/components/ui/badge"
import { Card, CardContent } from "~/components/ui/card"
import { LEGAL_CONTENT } from "~/content/legal"
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
  pageKey: Exclude<PageKey, "home" | "privacy" | "terms">
}) {
  const copy = pageCopyFor(locale, pageKey)
  const documentation = PAGE_KEYS.filter(
    (key): key is Exclude<PageKey, "home" | "privacy" | "terms"> =>
      !["home", "privacy", "terms"].includes(key),
  )

  return (
    <>
      <SiteHeader locale={locale} pageKey={pageKey} />
      <main className="mx-auto grid min-h-[75svh] max-w-6xl gap-12 px-6 pb-24 pt-36 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Documentation
          </p>
          <nav className="flex flex-col gap-1">
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
          <Badge variant="secondary">{copy.eyebrow}</Badge>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-6xl">
            {copy.title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
            {copy.description}
          </p>
        </article>
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
