import { LOCALES } from "~/content/locales"
import { pageCopyFor } from "~/content/pages"
import {
  LOCALE_IDS,
  localeTargets,
  publicRouteFor,
  type LocaleId,
  type PageKey,
} from "~/content/routes"

const ORIGIN = "https://channprj.github.io"

export function metadataFor(locale: LocaleId, pageKey: PageKey) {
  const copy = pageCopyFor(locale, pageKey)
  const targets = localeTargets(pageKey)
  const alternates = Object.fromEntries(
    LOCALE_IDS.map((targetLocale) => [
      targetLocale,
      `${ORIGIN}${targets[targetLocale]}`,
    ]),
  ) as Record<LocaleId, string>

  return {
    title: copy.title,
    description: copy.description,
    canonical: `${ORIGIN}${publicRouteFor(locale, pageKey)}`,
    alternates: {
      ...alternates,
      "x-default": alternates.ko,
    },
    ogLocale: LOCALES[locale].ogLocale,
  }
}
