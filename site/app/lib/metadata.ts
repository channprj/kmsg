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
const SITE_URL = `${ORIGIN}/kmsg/`
const ORGANIZATION_ID = "https://chann.dev/#organization"

export function homepageStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}#software-application`,
        name: "kmsg",
        alternateName: "kmsg KakaoTalk CLI and MCP server",
        description:
          "An unofficial open-source KakaoTalk CLI and native stdio MCP server for macOS that reads, watches, and sends messages through the Accessibility API.",
        url: SITE_URL,
        applicationCategory: "DeveloperApplication",
        applicationSubCategory: "Messaging automation",
        operatingSystem: "macOS 13 or later",
        license: "https://github.com/channprj/kmsg/blob/main/LICENSE",
        downloadUrl: "https://github.com/channprj/kmsg/releases/latest",
        sameAs: ["https://github.com/channprj/kmsg"],
        author: { "@id": ORGANIZATION_ID },
        provider: { "@id": ORGANIZATION_ID },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: "https://github.com/channprj/kmsg/releases/latest",
        },
      },
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: "CHANN",
        description: "An independent build-in-public product engineering organization.",
        url: "https://chann.dev",
        email: "iam@chann.dev",
        sameAs: ["https://github.com/chann", "https://github.com/channprj"],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "technical support",
          email: "iam@chann.dev",
          url: `${SITE_URL}contact/`,
          availableLanguage: ["ko", "en"],
        },
        address: {
          "@type": "PostalAddress",
          addressLocality: "Seoul",
          addressCountry: "KR",
        },
      },
    ],
  } as const
}

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
