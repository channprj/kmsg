import type { ReactNode } from "react"
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router"

import type { Route } from "./+types/root"
import "./app.css"

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className="dark" data-theme="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
