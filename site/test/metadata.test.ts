import { describe, expect, it } from "vitest"

import { LOCALE_IDS, PAGE_KEYS, publicRouteFor } from "~/content/routes"
import { metadataFor } from "~/lib/metadata"
import { meta } from "~/routes/page"

describe("localized metadata", () => {
  it("covers every canonical route from the legacy source copy", () => {
    for (const locale of LOCALE_IDS) {
      for (const pageKey of PAGE_KEYS) {
        const metadata = metadataFor(locale, pageKey)
        expect(metadata.title.length).toBeGreaterThan(10)
        expect(metadata.description.length).toBeGreaterThan(10)
        expect(metadata.canonical).toBe(
          `https://channprj.github.io${publicRouteFor(locale, pageKey)}`,
        )
      }
    }
  })

  it("uses one route table for every hreflang alternate", () => {
    const metadata = metadataFor("jp", "architecture")
    expect(metadata.alternates).toEqual({
      ko: "https://channprj.github.io/kmsg/architecture/",
      en: "https://channprj.github.io/kmsg/en/architecture/",
      jp: "https://channprj.github.io/kmsg/jp/architecture/",
      cn: "https://channprj.github.io/kmsg/cn/architecture/",
      "x-default": "https://channprj.github.io/kmsg/architecture/",
    })
    expect(metadata.ogLocale).toBe("ja_JP")
  })

  it("derives route metadata from the actual prerender location", () => {
    const descriptors = meta({
      location: { pathname: "/cn/architecture/" },
    } as Parameters<typeof meta>[0])

    expect(descriptors).toContainEqual({
      tagName: "link",
      rel: "canonical",
      href: "https://channprj.github.io/kmsg/cn/architecture/",
    })
    expect(descriptors).toContainEqual({
      property: "og:locale",
      content: "zh_CN",
    })
  })
})
