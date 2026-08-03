import { useLocation } from "react-router"

import type { Route } from "./+types/page"
import { PageView } from "~/components/page-view"
import { LOCALES } from "~/content/locales"
import { LOCALE_IDS, routeFromPath } from "~/content/routes"
import { metadataFor } from "~/lib/metadata"

function routeFromParams(params: Route.MetaArgs["params"]) {
  const splat = params["*"]
  return routeFromPath(splat ? `/${splat}/` : "/")
}

export function meta({ params }: Route.MetaArgs) {
  const route = routeFromParams(params) ?? { locale: "ko" as const, pageKey: "home" as const }
  const metadata = metadataFor(route.locale, route.pageKey)
  return [
    { title: metadata.title },
    { name: "description", content: metadata.description },
    { property: "og:title", content: metadata.title },
    { property: "og:description", content: metadata.description },
    { property: "og:locale", content: metadata.ogLocale },
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
