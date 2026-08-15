# kmsg — macOS용 카카오톡 CLI 및 MCP 서버

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Total downloads](https://img.shields.io/github/downloads/channprj/kmsg/total?label=downloads&logo=github)](https://github.com/channprj/kmsg/releases)

[프로젝트 홈페이지](https://channprj.github.io/kmsg/) · [English](README.en.md)

<p data-brand-signature>
  <img src="assets/brand/source/kmsg-signature-light.svg#gh-light-mode-only" alt="kmsg" width="220" />
  <img src="assets/brand/source/kmsg-signature-dark.svg#gh-dark-mode-only" alt="kmsg" width="220" />
</p>

`kmsg`는 macOS용 비공식 카카오톡 CLI이자 네이티브 MCP 서버입니다.
macOS 손쉬운 사용 API로 메시지를 읽고, 감시하고, 전송하며 로컬 자동화와
AI 에이전트를 위한 구조화된 출력을 제공합니다.

> **Disclaimer**: `kmsg`는 Kakao Corp. 의 공식 도구가 아닙니다.
> 사용자는 본인 계정/환경에서 관련 법규, 서비스 약관, 회사 보안 정책을 준수할 책임이 있습니다.
> 이 도구 사용으로 발생할 수 있는 계정 제한, 오작동, 데이터 손실, 기타 손해에 대한 책임은 사용자에게 있습니다.
> LOCO Protocol 이 아닌 AX 를 사용한 이유와 계정 제재 가능성에 대한 제 개인적인 판단은 [왜 KakaoTalk 의 LOCO Protocol 을 사용하지 않나요?](ARCHITECTURE.md#accessibility-instead-of-a-private-protocol) 항목을 참고해 주세요.

## AX(Accessibility API)를 핵심으로 개발

`kmsg`는 macOS의 공식 Accessibility API, 즉 AX를 핵심 자동화 계층으로
사용해 개발되었습니다. Swift에서 `ApplicationServices`와 `AXUIElement`를
직접 호출해 사용자가 보는 KakaoTalk 창, 채팅 목록, 메시지 영역, 입력창을
탐색하고 제어합니다. 키보드와 마우스 입력이 필요한 동작은 `CGEvent`를
사용합니다.

```text
CLI / MCP
  → KakaoTalkApp
  → UIElement
  → AXUIElement
  → macOS용 KakaoTalk
```

- [`UIElement`](Sources/kmsg/Accessibility/UIElement.swift)는 AX 속성 조회,
  계층 탐색, 값 설정, 액션 실행을 Swift 인터페이스로 감쌉니다.
- [`AXActionRunner`](Sources/kmsg/Accessibility/AXActionRunner.swift)는
  AX 액션과 `CGEvent` 기반 입력을 실행합니다.
- [`AXPathCache`](Sources/kmsg/Accessibility/AXPathCache.swift)는 자주 쓰는
  UI 경로를 캐시하고, KakaoTalk UI가 바뀌어 경로가 유효하지 않으면 다시
  탐색할 수 있게 합니다.

이 구조는 `kmsg` 자체가 KakaoTalk 서버나 비공개 LOCO 프로토콜에 직접
연결하지 않고, 사용자가 실제로 조작하는 앱 UI를 통해 동작한다는 뜻입니다.
따라서 설치한 `kmsg` 바이너리에 macOS 손쉬운 사용 권한이 필요하며,
KakaoTalk UI 구조가 바뀌면 일부 탐색 경로가 영향을 받을 수 있습니다.
자세한 설계 배경과 제약은 [아키텍처 문서](ARCHITECTURE.md)를 참고하세요.

## 데모

https://github.com/user-attachments/assets/c620b2e3-7106-40fa-86d1-ed847e3b1a6f

## 실사용 후기

<a href="https://www.youtube.com/watch?v=_Pd1G33_R48&t=1020s"><img src="https://i.ytimg.com/vi/_Pd1G33_R48/maxresdefault.jpg" alt="실사용 후기: 헤르메스 에이전트 5개로 뉴스 큐레이션부터 주식 매매까지 자동화한 방법 전부 공개합니다" width="400" /></a>

**Builder Josh:** [헤르메스 에이전트 5개로 뉴스 큐레이션부터 주식 매매까지 자동화한 방법 전부 공개합니다 (AI 엔지니어 샘 호트만님)](https://www.youtube.com/watch?v=_Pd1G33_R48&t=1020s) — 17:00부터 재생

<a href="https://www.youtube.com/watch?v=xz5fA7OyvQ0"><img src="https://i.ytimg.com/vi/xz5fA7OyvQ0/maxresdefault.jpg" alt="실사용 후기: 나만의 Hermes 시스템 구축 방법" width="400" /></a>

**샘 호트만:** [나만의 Hermes 시스템 구축 방법 (문제정의부터 구축까지, 해외 AI 인사이트 발굴하기)](https://www.youtube.com/watch?v=xz5fA7OyvQ0)

## 주요 기능

- 채팅 목록을 조회하고 재사용 가능한 로컬 `chat_id`를 생성합니다.
- 최근 메시지를 읽거나 새 메시지를 실시간으로 감시합니다.
- 화면에 표시되는 KakaoTalk UI를 제어해 텍스트와 이미지를 전송합니다.
- 구조화된 JSON을 `stdout`으로 출력하고 AX 추적 로그는 `stderr`로 분리합니다.
- 읽기, 텍스트 전송, 이미지 전송 도구를 제공하는 native stdio MCP 서버를 실행합니다.
- background-safe 읽기, 창 레이아웃, 복구 모드, self-healing AX path cache를 지원합니다.

## 요구사항

- macOS 13 이상
- [macOS용 KakaoTalk](https://apps.apple.com/kr/app/kakaotalk/id869223134?mt=12)
- 설치된 `kmsg` 바이너리에 대한 손쉬운 사용 권한

## 설치

Homebrew 설치를 권장합니다.

```bash
brew install channprj/tap/kmsg
```

직접 다운로드와 소스 빌드 방법은 [USAGE.md](USAGE.md#installation)를 참고하세요.

## 빠른 시작

```bash
kmsg status
kmsg chats
kmsg read "채팅방 이름" --limit 20
kmsg send "채팅방 이름" "안녕하세요" --dry-run
```

`kmsg status`는 손쉬운 사용 권한을 요청하고, 필요하면 KakaoTalk을 실행한
뒤 로그인 상태를 확인합니다. 마지막 명령은 dry run이므로 실제 메시지를
전송하지 않습니다.

## 코딩 에이전트 스킬

저장소에 포함된 `kmsg` 스킬을 설치하면 Claude Code와 Codex가 채팅방을
구조화된 JSON으로 찾고, 안정적인 `chat_id`로 메시지를 읽고, 전송 전에
dry-run을 수행하는 공통 워크플로우를 사용할 수 있습니다. 먼저 위의
Homebrew 명령으로 `kmsg`를 설치한 다음 스킬을 전역 설치하세요.

```bash
npx skills add channprj/kmsg --skill kmsg --agent claude-code codex -g -y
```

호출 방법은 에이전트마다 다음과 같습니다.

| 에이전트 | 호출 |
| --- | --- |
| Claude Code | `/kmsg` |
| Codex | `$kmsg` |

```text
/kmsg 출시 준비 채팅방의 최근 메시지 10개를 요약해줘
$kmsg 출시 준비 채팅방에 '배포 완료했습니다.'라고 보내줘
```

스킬은 텍스트 전송 전에 항상 dry-run으로 수신자와 내용을 확인합니다.
사용자가 명시적으로 전송을 요청한 경우에만 실제 `send`를 한 번 실행하며,
초안 작성이나 미리보기 요청은 전송하지 않습니다. `send-image`에는
dry-run이 없으므로 명확한 수신자와 실제 이미지 전송 요청이 모두 있어야
실행합니다. 설치 후 스킬이 보이지 않으면 에이전트 세션을 다시 시작하세요.

## 자세한 문서

- [사용법](USAGE.md) — 설치, 명령, 설정, 예제, 문제 해결
- [아키텍처](ARCHITECTURE.md) — 구성 요소, 데이터 흐름, 상태, 설계 결정
- [OpenClaw 연동](docs/openclaw.md) — MCP 및 실시간 watch 연동
- [버전 관리](VERSIONING.md) — 릴리즈 형식과 자동화
- [영문 README](README.en.md) — 이 문서의 영문 버전

## 자주 묻는 질문

### kmsg는 무엇인가요?

`kmsg`는 macOS용 비공식 오픈소스 카카오톡 CLI이자 네이티브 MCP
서버입니다. 사용자, 스크립트, AI 에이전트가 명령줄에서 카카오톡
메시지를 읽고, 감시하고, 전송할 수 있게 해줍니다.

### kmsg는 카카오톡 공식 도구인가요?

아닙니다. `kmsg`는 Kakao Corp.와 제휴하거나 Kakao Corp.의 보증을 받은
도구가 아니며, 독립적으로 관리되는 오픈소스 프로젝트입니다.

### 어떤 운영체제를 지원하나요?

`kmsg`는 macOS 13 이상과 macOS용 KakaoTalk을 필요로 합니다. Windows,
Linux, Android, iOS는 지원하지 않습니다.

### kmsg는 카카오톡에 어떻게 접근하나요?

Apple의 macOS 손쉬운 사용 API를 통해 화면에 표시되는 KakaoTalk
애플리케이션을 제어합니다. KakaoTalk의 비공개 LOCO 프로토콜은 구현하지
않습니다.

### MCP 서버가 포함되어 있나요?

네. 네이티브 `kmsg mcp-server` 명령은 MCP 호환 클라이언트와 AI
에이전트에 읽기, 텍스트 전송, 이미지 전송 도구를 stdio로 제공합니다.

### kmsg는 어떻게 설치하나요?

`brew install channprj/tap/kmsg`를 실행해 Homebrew로 설치할 수 있습니다.
직접 다운로드와 소스 빌드 방법은 [사용법](USAGE.md)에서 확인할 수 있습니다.

## 영감

이 프로젝트는 [steipete](https://github.com/steipete)와 그의
[imsg](https://github.com/steipete/imsg), 그리고
[OpenClaw](https://github.com/openclaw/openclaw)에서 큰 영감을 받았습니다.

## 라이선스

`kmsg`는 [MIT License](LICENSE)로 제공됩니다.
