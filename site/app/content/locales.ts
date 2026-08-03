import legacyContent from "./legacy-content.json"
import type { LocaleId } from "./routes"

export interface LocaleUi {
  navigation: string
  usage: string
  architecture: string
  skill: string
  skip: string
  toc: string
  source: string
  sourceAction: string
  lightTheme: string
  darkTheme: string
  menuOpen: string
  menuClose: string
  language: string
  copy: string
  copied: string
  copyFailed: string
  table: string
  updated: string
  edit: string
  pipeline: string
  footerTagline: string
  footerDisclaimer: string
  privacy: string
  terms: string
}

export interface LocaleConfig {
  id: LocaleId
  lang: string
  hrefLang: string
  prefix: string
  label: string
  name: string
  dateLocale: string
  ogLocale: string
  ui: LocaleUi
}

export const LOCALES = legacyContent.locales as unknown as Record<
  LocaleId,
  LocaleConfig
>
