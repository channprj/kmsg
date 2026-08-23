import { describe, expect, it } from "vitest"

import { LOCALE_IDS, PAGE_KEYS, publicRouteFor } from "~/content/routes"
import { homepageStructuredData, metadataFor } from "~/lib/metadata"
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

  it("describes kmsg and its public maintainer organization", () => {
    const structuredData = homepageStructuredData()
    const graph = structuredData["@graph"]
    const application = graph.find((entry) => entry["@type"] === "SoftwareApplication")
    const organization = graph.find((entry) => entry["@type"] === "Organization")

    expect(application).toMatchObject({
      name: "kmsg",
      url: "https://channprj.github.io/kmsg/",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "macOS 13 or later",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    })
    expect(organization).toMatchObject({
      name: "CHANN",
      url: "https://chann.dev",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "technical support",
        email: "iam@chann.dev",
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Seoul",
        addressCountry: "KR",
      },
    })
    expect(JSON.stringify(structuredData)).not.toContain("telephone")
  })
})
