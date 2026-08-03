import { Button } from "~/components/ui/button"

export function meta() {
  return [
    { title: "kmsg — 터미널에서 카카오톡 자동화" },
    {
      name: "description",
      content: "macOS 카카오톡을 읽고 전송하는 접근성 기반 CLI",
    },
  ]
}

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-24">
      <p className="mb-4 text-sm font-medium text-primary">macOS CLI</p>
      <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-7xl">
        터미널에서 카카오톡을 자동화하세요.
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
        kmsg는 macOS 접근성 API로 채팅을 읽고 메시지를 보내는 오픈소스 CLI입니다.
      </p>
      <div className="mt-8">
        <Button asChild size="lg">
          <a href="https://github.com/channprj/kmsg">GitHub에서 보기</a>
        </Button>
      </div>
    </main>
  )
}
