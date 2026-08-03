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
import { routeFromPath } from "./content/routes"
import "./app.css"

export function Layout({ children }: { children: ReactNode }) {
  const route = routeFromPath(useLocation().pathname)
  const lang = LOCALES[route?.locale ?? "ko"].lang
  const themeBootstrap = `(() => { try { const saved = localStorage.getItem("kmsg-theme"); const theme = saved === "paper" ? "paper" : "dark"; document.documentElement.dataset.theme = theme; document.documentElement.classList.toggle("dark", theme === "dark"); } catch { document.documentElement.dataset.theme = "dark"; document.documentElement.classList.add("dark"); } })();`
  return (
    <html lang={lang} className="dark" data-theme="dark" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#131209" />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
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
      <a className="mt-8 text-primary underline-offset-4 hover:underline" href="/kmsg/">
        kmsg 홈으로 이동
      </a>
    </main>
  )
}
