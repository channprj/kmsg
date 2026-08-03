import documentContent from "./document-content.json"
import type { LocaleId, PageKey } from "./routes"

export type DocumentPageKey = Exclude<PageKey, "home" | "privacy" | "terms">

export interface DocumentHeading {
  level: number
  id: string
  label: string
}

export interface DocumentContent {
  locale: LocaleId
  pageKey: DocumentPageKey
  title: string
  source: string
  sourceLabel: string
  lastModified: string
  html: string
  headings: DocumentHeading[]
}

const documents = documentContent as DocumentContent[]

export function documentFor(locale: LocaleId, pageKey: DocumentPageKey) {
  const document = documents.find(
    (candidate) => candidate.locale === locale && candidate.pageKey === pageKey,
  )
  if (!document) throw new Error(`Missing document content for ${locale}:${pageKey}`)
  return document
}
