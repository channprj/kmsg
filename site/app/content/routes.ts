export const LOCALE_IDS = ["ko", "en", "jp", "cn"] as const
export const PAGE_KEYS = [
  "home",
  "usage",
  "architecture",
  "mcp",
  "skill",
  "versioning",
  "developers",
  "about",
  "contact",
  "privacy",
  "terms",
] as const

export type LocaleId = (typeof LOCALE_IDS)[number]
export type PageKey = (typeof PAGE_KEYS)[number]

export const SITE_BASE_PATH = "/kmsg"

const localePrefixes: Record<LocaleId, string> = {
  ko: "",
  en: "en",
  jp: "jp",
  cn: "cn",
}

const pageSlugs: Record<PageKey, string> = {
  home: "",
  usage: "usage",
  architecture: "architecture",
  mcp: "mcp",
  skill: "skill",
  versioning: "versioning",
  developers: "developers",
  about: "about",
  contact: "contact",
  privacy: "privacy",
  terms: "terms",
}

export function routeFor(locale: LocaleId, pageKey: PageKey) {
  const segments = [localePrefixes[locale], pageSlugs[pageKey]].filter(Boolean)
  return segments.length === 0 ? "/" : `/${segments.join("/")}/`
}

export function publicRouteFor(locale: LocaleId, pageKey: PageKey) {
  return `${SITE_BASE_PATH}${routeFor(locale, pageKey)}`
}

export const CANONICAL_ROUTES = LOCALE_IDS.flatMap((locale) =>
  PAGE_KEYS.map((pageKey) => ({
    locale,
    pageKey,
    path: routeFor(locale, pageKey),
    publicPath: publicRouteFor(locale, pageKey),
  })),
)

const routeLookup = new Map(
  CANONICAL_ROUTES.map(({ locale, pageKey, path }) => [
    path,
    { locale, pageKey },
  ]),
)

export function routeFromPath(pathname: string): {
  locale: LocaleId
  pageKey: PageKey
} | null {
  let path = pathname.split(/[?#]/, 1)[0] || "/"
  if (path === SITE_BASE_PATH) path = "/"
  else if (path.startsWith(`${SITE_BASE_PATH}/`)) {
    path = path.slice(SITE_BASE_PATH.length)
  }
  if (!path.startsWith("/")) path = `/${path}`
  if (!path.endsWith("/")) path = `${path}/`
  if (path === "/ko/") path = "/"
  else if (path.startsWith("/ko/")) path = path.slice(3)
  path = path.replace(/\/openclaw\/$/, "/mcp/")
  return routeLookup.get(path) ?? null
}

export function localeTargets(pageKey: PageKey): Record<LocaleId, string> {
  return Object.fromEntries(
    LOCALE_IDS.map((locale) => [locale, publicRouteFor(locale, pageKey)]),
  ) as Record<LocaleId, string>
}
