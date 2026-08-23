import legacyContent from "./legacy-content.json"
import trustContent from "./trust-content.json"
import type { LocaleId, PageKey } from "./routes"

export interface PageCopy {
  title: string
  description: string
  eyebrow: string
  source?: string
  sourceLabel?: string
  faqHeading?: string
  previewLabel?: string
  chatName?: string
  secondaryChat?: string
  firstSender?: string
  firstMessage?: string
  secondMessage?: string
  replyMessage?: string
  firstTime?: string
  secondTime?: string
}

const pages = [...legacyContent.pages, ...trustContent.pages] as unknown as Array<
  PageCopy & { locale: LocaleId; pageKey: string; source: string }
>

export function pageCopyFor(locale: LocaleId, pageKey: PageKey): PageCopy {
  const legacyPageKey = pageKey === "mcp" ? "openclaw" : pageKey
  const page = pages.find(
    (candidate) =>
      candidate.locale === locale && candidate.pageKey === legacyPageKey,
  )
  if (!page) throw new Error(`Missing page copy for ${locale}:${pageKey}`)
  return page
}

export function sourceFor(locale: LocaleId, pageKey: PageKey) {
  const page = pageCopyFor(locale, pageKey)
  if (!page.source) throw new Error(`Missing page source for ${locale}:${pageKey}`)
  return page.source
}
