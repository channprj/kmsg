# kmsg — KakaoTalk CLI & MCP server for macOS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Total downloads](https://img.shields.io/github/downloads/channprj/kmsg/total?label=downloads&logo=github)](https://github.com/channprj/kmsg/releases)

[Project website](https://channprj.github.io/kmsg/en/) · [한국어](README.md)

<p data-brand-signature>
  <img src="assets/brand/source/kmsg-signature-light.svg#gh-light-mode-only" alt="kmsg" width="220" />
  <img src="assets/brand/source/kmsg-signature-dark.svg#gh-dark-mode-only" alt="kmsg" width="220" />
</p>

`kmsg` is an unofficial KakaoTalk CLI and native MCP server for macOS.
It reads, watches, and sends messages through the macOS Accessibility API,
with structured output for local automation and AI agents.

> **Disclaimer:** `kmsg` is not an official Kakao Corp. tool.
> You are responsible for complying with applicable laws, service terms, and
> organizational security policies in your own account and environment.
> Use may result in account restrictions, malfunction, data loss, or other harm.
> The reasoning behind using macOS Accessibility instead of the private LOCO
> protocol is documented in [Architecture](ARCHITECTURE.md#accessibility-instead-of-a-private-protocol)
> and represents the author's personal assessment, not Kakao's position.

## Demo

https://github.com/user-attachments/assets/c620b2e3-7106-40fa-86d1-ed847e3b1a6f

## Featured video

<a href="https://www.youtube.com/watch?v=_Pd1G33_R48&t=1020s"><img src="https://i.ytimg.com/vi/_Pd1G33_R48/maxresdefault.jpg" alt="Featured video: 헤르메스 에이전트 5개로 뉴스 큐레이션부터 주식 매매까지 자동화한 방법 전부 공개합니다" width="400" /></a>

**Builder Josh:** [헤르메스 에이전트 5개로 뉴스 큐레이션부터 주식 매매까지 자동화한 방법 전부 공개합니다 (AI 엔지니어 샘 호트만님)](https://www.youtube.com/watch?v=_Pd1G33_R48&t=1020s) — starts at 17:00

<a href="https://www.youtube.com/watch?v=xz5fA7OyvQ0"><img src="https://i.ytimg.com/vi/xz5fA7OyvQ0/maxresdefault.jpg" alt="Featured video: 나만의 Hermes 시스템 구축 방법" width="400" /></a>

**Sam Hottman:** [나만의 Hermes 시스템 구축 방법 (문제정의부터 구축까지, 해외 AI 인사이트 발굴하기)](https://www.youtube.com/watch?v=xz5fA7OyvQ0)

## Highlights

- List chats and assign reusable local `chat_id` values.
- Read recent messages or watch a chat for new messages.
- Send text and images by controlling the visible KakaoTalk UI.
- Produce structured JSON while keeping AX traces on `stderr`.
- Run a native stdio MCP server with read, send, and image-send tools.
- Use background-safe reads, configurable window layouts, recovery modes, and
  a self-healing AX path cache.

## Requirements

- macOS 13 or later
- [KakaoTalk for macOS](https://apps.apple.com/kr/app/kakaotalk/id869223134?mt=12)
- Accessibility permission for the installed `kmsg` binary

## Installation

Homebrew is the primary installation path:

```bash
brew install channprj/tap/kmsg
```

Direct-download and source-build instructions are in [USAGE.md](USAGE.md#installation).

## Quick start

```bash
kmsg status
kmsg chats
kmsg read "Chat name" --limit 20
kmsg send "Chat name" "Hello" --dry-run
```

`kmsg status` requests Accessibility permission, launches KakaoTalk when
needed, and checks authentication. The final command is a dry run and does not
send a message.

## Coding agent skill

The bundled `kmsg` skill gives Claude Code and Codex the same structured
workflow for finding chats as JSON, reading through stable `chat_id` values,
and previewing sends with a dry run. Install the `kmsg` binary with Homebrew
first, then install the skill globally:

```bash
npx skills add channprj/kmsg --skill kmsg --agent claude-code codex -g -y
```

Invoke it with the selector for your agent:

| Agent | Invocation |
| --- | --- |
| Claude Code | `/kmsg` |
| Codex | `$kmsg` |

```text
/kmsg Summarize the 10 latest messages in Release Prep
$kmsg Send 'Deployment complete.' to Release Prep
```

The skill always checks the recipient and text with `dry-run` before a text
send. It runs the real `send` once only when the user explicitly asks to send;
draft and preview requests never send. Because `send-image` has no dry-run, it
runs only when both the recipient and actual image delivery are explicit.
Restart the agent session if the newly installed skill does not appear.

## More documentation

- [Usage](USAGE.md) — installation, commands, configuration, examples, and troubleshooting
- [Architecture](ARCHITECTURE.md) — components, data flow, state, and design decisions
- [OpenClaw integration](docs/openclaw.md) — MCP and real-time watch integration
- [Versioning](VERSIONING.md) — release format and automation
- [Korean README](README.md) — Korean version of this document

## Frequently asked questions

### What is kmsg?

`kmsg` is an unofficial, open-source KakaoTalk CLI and native MCP server for
macOS. It lets people, scripts, and AI agents read, watch, and send KakaoTalk
messages from the command line.

### Is kmsg an official KakaoTalk tool?

No. `kmsg` is an independent open-source project and is not affiliated with,
endorsed by, or maintained by Kakao Corp.

### Which operating systems does kmsg support?

`kmsg` supports macOS 13 or later and requires KakaoTalk for macOS. It does not
support Windows, Linux, Android, or iOS.

### How does kmsg access KakaoTalk?

`kmsg` controls the visible KakaoTalk macOS application through Apple's
Accessibility API. It does not implement KakaoTalk's private LOCO protocol.

### Does kmsg include an MCP server?

Yes. The native `kmsg mcp-server` command exposes read, text-send, and
image-send tools over stdio for MCP-compatible clients and AI agents.

### How do I install kmsg?

Install it with Homebrew by running `brew install channprj/tap/kmsg`. Direct
downloads and source-build instructions are available in [Usage](USAGE.md).

## Inspiration

This project is strongly inspired by
[steipete](https://github.com/steipete) and his work on
[imsg](https://github.com/steipete/imsg), as well as
[OpenClaw](https://github.com/openclaw/openclaw).

## License

`kmsg` is available under the [MIT License](LICENSE).
