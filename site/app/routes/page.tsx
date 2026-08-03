import { useLocation } from "react-router"

import type { Route } from "./+types/page"
import { PageView } from "~/components/page-view"
import { LOCALES } from "~/content/locales"
import { LOCALE_IDS, routeFromPath } from "~/content/routes"
import { metadataFor } from "~/lib/metadata"

export function meta({ location }: Route.MetaArgs) {
  const route = routeFromPath(location.pathname) ?? { locale: "ko" as const, pageKey: "home" as const }
  const metadata = metadataFor(route.locale, route.pageKey)
  const image = "https://channprj.github.io/kmsg/assets/kmsg-logo.jpg"
  return [
    { title: metadata.title },
    { name: "description", content: metadata.description },
    { name: "author", content: "channprj" },
    { name: "application-name", content: "kmsg" },
    { name: "robots", content: "index,follow,max-image-preview:large" },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "kmsg" },
    { property: "og:title", content: metadata.title },
    { property: "og:description", content: metadata.description },
    { property: "og:url", content: metadata.canonical },
    { property: "og:image", content: image },
    { property: "og:image:type", content: "image/jpeg" },
    { property: "og:image:width", content: "1000" },
    { property: "og:image:height", content: "1000" },
    { property: "og:image:alt", content: "kmsg KakaoTalk CLI logo" },
    { property: "og:locale", content: metadata.ogLocale },
    ...LOCALE_IDS.filter((locale) => locale !== route.locale).map((locale) => ({
      property: "og:locale:alternate",
      content: LOCALES[locale].ogLocale,
    })),
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: metadata.title },
    { name: "twitter:description", content: metadata.description },
    { name: "twitter:image", content: image },
    { name: "twitter:image:alt", content: "kmsg KakaoTalk CLI logo" },
    { tagName: "link", rel: "canonical", href: metadata.canonical },
    ...LOCALE_IDS.map((locale) => ({
      tagName: "link",
      rel: "alternate",
      hrefLang: LOCALES[locale].hrefLang,
      href: metadata.alternates[locale],
    })),
    {
      tagName: "link",
      rel: "alternate",
      hrefLang: "x-default",
      href: metadata.alternates["x-default"],
    },
  ]
}

export default function PageRoute() {
  const route = routeFromPath(useLocation().pathname)
  if (!route) throw new Response("Not Found", { status: 404 })
  return <PageView {...route} />
}
