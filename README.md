# kmsg

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Total downloads](https://img.shields.io/github/downloads/channprj/kmsg/total?label=downloads&logo=github)](https://github.com/channprj/kmsg/releases)

[한국어](README.ko.md)

<p><img src="assets/kmsg-logo.jpg" alt="kmsg logo" width="220" /></p>

> **Disclaimer:** `kmsg` is not an official Kakao Corp. tool.
> You are responsible for complying with applicable laws, service terms, and
> organizational security policies in your own account and environment.
> Use may result in account restrictions, malfunction, data loss, or other harm.
> The reasoning behind using macOS Accessibility instead of the private LOCO
> protocol is documented in [Architecture](ARCHITECTURE.md#accessibility-instead-of-a-private-protocol)
> and represents the author's personal assessment, not Kakao's position.

`kmsg` is a macOS CLI for reading, watching, and sending KakaoTalk messages.
It uses the macOS Accessibility API and is designed for both interactive use
and automation through JSON output, hooks, AI agents, and MCP clients.

## Demo

https://github.com/user-attachments/assets/c620b2e3-7106-40fa-86d1-ed847e3b1a6f

## Featured video

[![Featured video: 헤르메스 에이전트 5개로 뉴스 큐레이션부터 주식 매매까지 자동화한 방법 전부 공개합니다](https://i.ytimg.com/vi/_Pd1G33_R48/hqdefault.jpg)](https://www.youtube.com/watch?v=_Pd1G33_R48&t=1020s)

**Builder Josh:** [헤르메스 에이전트 5개로 뉴스 큐레이션부터 주식 매매까지 자동화한 방법 전부 공개합니다 (AI 엔지니어 샘 호트만님)](https://www.youtube.com/watch?v=_Pd1G33_R48&t=1020s) — starts at 17:00

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

## More documentation

- [Usage](USAGE.md) — installation, commands, configuration, examples, and troubleshooting
- [Architecture](ARCHITECTURE.md) — components, data flow, state, and design decisions
- [OpenClaw integration](docs/openclaw.md) — MCP and real-time watch integration
- [Versioning](VERSIONING.md) — release format and automation
- [Korean README](README.ko.md) — Korean mirror of this document

## Inspiration

This project is strongly inspired by
[steipete](https://github.com/steipete) and his work on
[imsg](https://github.com/steipete/imsg), as well as
[OpenClaw](https://github.com/openclaw/openclaw).

## License

`kmsg` is available under the [MIT License](LICENSE).
