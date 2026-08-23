import { describe, expect, it } from "vitest"

import {
  CANONICAL_ROUTES,
  LOCALE_IDS,
  PAGE_KEYS,
  localeTargets,
  publicRouteFor,
  routeFor,
  routeFromPath,
} from "~/content/routes"

describe("localized route table", () => {
  it("contains 44 unique canonical pages", () => {
    expect(LOCALE_IDS).toHaveLength(4)
    expect(PAGE_KEYS).toHaveLength(11)
    expect(CANONICAL_ROUTES).toHaveLength(44)
    expect(new Set(CANONICAL_ROUTES.map(({ path }) => path)).size).toBe(44)
  })

  it("round-trips every locale and page key", () => {
    for (const locale of LOCALE_IDS) {
      for (const pageKey of PAGE_KEYS) {
        const path = routeFor(locale, pageKey)
        expect(path.endsWith("/")).toBe(true)
        expect(routeFromPath(path)).toEqual({ locale, pageKey })
        expect(routeFromPath(publicRouteFor(locale, pageKey))).toEqual({
          locale,
          pageKey,
        })
      }
    }
  })

  it("maps every language to the same page", () => {
    expect(localeTargets("usage")).toEqual({
      ko: "/kmsg/usage/",
      en: "/kmsg/en/usage/",
      jp: "/kmsg/jp/usage/",
      cn: "/kmsg/cn/usage/",
    })
    expect(localeTargets("about")).toEqual({
      ko: "/kmsg/about/",
      en: "/kmsg/en/about/",
      jp: "/kmsg/jp/about/",
      cn: "/kmsg/cn/about/",
    })
  })

  it("rejects unknown and legacy paths", () => {
    expect(routeFromPath("/kmsg/fr/usage/")).toBeNull()
    expect(routeFromPath("/kmsg/ko/usage/")).toBeNull()
    expect(routeFromPath("/kmsg/openclaw/")).toBeNull()
  })
})
