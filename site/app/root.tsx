import type { ReactNode } from "react"
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLocation,
} from "react-router"

import type { Route } from "./+types/root"
import { LOCALES } from "./content/locales"
import { publicRouteFor, routeFromPath } from "./content/routes"
import {
  THEME_BOOTSTRAP,
  readThemeFromDocument,
  themeColorFor,
} from "./lib/theme"
import "./app.css"

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/kmsg/assets/favicon.svg", type: "image/svg+xml" },
  { rel: "manifest", href: "/kmsg/site.webmanifest" },
  { rel: "describedby", href: "/kmsg/llms.txt", title: "LLM-readable site index" },
]

export function Layout({ children }: { children: ReactNode }) {
  const route = routeFromPath(useLocation().pathname)
  const lang = LOCALES[route?.locale ?? "ko"].lang
  const markdownHref = route
    ? `${publicRouteFor(route.locale, route.pageKey)}index.md`
    : "/kmsg/index.md"
  const theme =
    typeof document === "undefined" ? "dark" : readThemeFromDocument()

  return (
    <html
      lang={lang}
      className={theme === "dark" ? "dark" : ""}
      data-theme={theme}
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content={themeColorFor(theme)} />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <link rel="alternate" href={markdownHref} type="text/markdown" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6">
      <p className="text-sm text-muted-foreground">{notFound ? "404" : "Error"}</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        {notFound ? "페이지를 찾을 수 없습니다." : "예상하지 못한 오류가 발생했습니다."}
      </h1>
      <a className="mt-8 text-primary-readable underline-offset-4 hover:underline" href="/kmsg/">
        kmsg 홈으로 이동
      </a>
    </main>
  )
}
