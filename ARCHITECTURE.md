# kmsg Architecture

## Overview

`kmsg` is a Swift 6 executable for macOS 13 and later. It controls KakaoTalk
through macOS Accessibility APIs instead of a network protocol.

The primary dependency direction is:

```text
CLI commands
    |
    +-- authentication and command orchestration
    |
    +-- KakaoTalk domain services
    |     +-- chat discovery and identity
    |     +-- window resolution
    |     +-- transcript resolution and parsing
    |
    +-- Accessibility helpers and AX path cache
          |
          +-- AXUIElement / CGEvent / AppKit
                |
                +-- KakaoTalk for macOS
```

The stdio MCP server is another entry point. It translates MCP tool calls into
subprocess invocations of the currently running `kmsg` executable, then returns
structured results to the client.

## Components

| Component | Responsibility |
|---|---|
| `Sources/kmsg/kmsg.swift` | Registers commands, exposes the embedded build version, and uses the invoked executable name in help output. |
| `Sources/kmsg/Commands/` | Parses CLI arguments, checks permissions, coordinates authentication, delegates operations, and formats human or JSON output. |
| `AccessibilityPermission` | Checks and requests macOS Accessibility permission and opens the correct System Settings pane. |
| `UIElement` | Wraps `AXUIElement`, exposes attributes and actions, and performs bounded hierarchy searches. |
| `AXActionRunner` | Performs focus, text-entry, keyboard, retry, and trace operations. |
| `AXPathCacheStore` | Stores validated AX paths for frequently used UI elements and invalidates stale entries. |
| `CredentialStore` | Encrypts the KakaoTalk password with AES-GCM and stores credentials and key material in owner-only files. |
| `KakaoTalkAuthenticator` | Detects login state, fills the login form, and provides a keyboard-only fallback. |
| `KakaoTalkApp` | Finds, launches, activates, and recovers the KakaoTalk process and its windows. |
| `ChatListScanner` | Locates the chat list, extracts names and previews, and warms related AX cache slots. |
| `ChatIdentityRegistryStore` | Assigns local synthetic `chat_id` values and maps them back to chat display names. |
| `ChatWindowResolver` | Reuses existing windows or opens chats through the list/search UI, with optional layout and recovery behavior. |
| `MessageContextResolver` | Finds the message input, chat pane, and transcript root for a resolved window. |
| `KakaoTalkTranscriptReader` | Extracts normalized message records, timestamps, images, links, and attachments from transcript rows. |
| `WatchCommand` | Repeatedly reads transcript snapshots, establishes a startup baseline, and emits only new eligible messages. |
| `KmsgMCPServer` | Implements MCP initialization, tool schemas, stdio framing, subprocess execution, timeout handling, and structured error mapping. |
| `VersionGenPlugin` / `VersionGenTool` | Validates `VERSION` and generates the build-time `BuildVersion` source. |

## Data flow

### Startup and authentication

1. A command checks Accessibility permission when UI access is required.
2. `AuthBootstrap` constructs `KakaoTalkApp`, which launches KakaoTalk when
   necessary.
3. `KakaoTalkAuthenticator` checks the current login state.
4. If login is required, it loads encrypted credentials or prompts the user,
   performs the login, and stores newly entered credentials.

`read --background-safe` is deliberately different: it constructs
`KakaoTalkApp(autoLaunch: false)` and skips automatic login and foreground UI
automation.

### Listing chats

1. `ChatsCommand` selects the visible chat-list window or recovers a usable
   KakaoTalk window.
2. `ChatListScanner` locates the chat-list container and extracts row titles and
   previews.
3. `ChatIdentityRegistryStore` matches discoveries against local records and
   assigns synthetic IDs.
4. Results are printed as text or encoded as JSON.

The registry is local state, not a KakaoTalk identifier. A renamed room is
treated as a new display identity, and duplicate names receive distinct local
records when they can be distinguished from the list.

### Resolving a chat

`ChatWindowResolver` tries progressively more invasive paths:

1. Reuse an existing matching chat window.
2. For a known `chat_id`, try its associated chat-list row.
3. Search for the recorded or requested display name.
4. When explicitly enabled, perform deeper window recovery.

In background-safe mode only step 1 is allowed. The resolver will not launch,
activate, search, open, resize, or close KakaoTalk windows.

### Reading messages

1. Resolve a chat window by name or `chat_id`.
2. `MessageContextResolver` identifies the input element, chat pane, and
   transcript root.
3. `KakaoTalkTranscriptReader` gathers message rows and extracts their semantic
   fields.
4. `ReadCommand` prints human-readable output or one JSON document.
5. A transiently opened window is closed unless `--keep-window` was supplied.

### Watching messages

1. Resolve the chat and read snapshots for up to two seconds until the tail
   stabilizes.
2. Use messages later than the watch start time as the initial eligible state.
3. Poll at a clamped interval between 0.2 and 10 seconds.
4. Compare snapshot overlap to find newly appended messages.
5. Emit human-readable records or one pretty JSON object per event.

Rows without a safe logical timestamp may be suppressed at startup to avoid
replaying old messages.

### Sending text or images

Text sending resolves the target window, finds and focuses the message input,
enters Unicode text through AX/keyboard helpers, and verifies the send action.
Image sending places the image on the macOS pasteboard, pastes it into the chat,
and handles KakaoTalk's confirmation UI.

Commands close only windows they opened transiently. `--keep-window` preserves
them.

### MCP calls

```text
MCP client
    |
    | Content-Length or newline-delimited JSON-RPC
    v
kmsg mcp-server
    |
    | subprocess: current kmsg executable
    +-- kmsg read --json ...
    +-- kmsg send ...
    +-- kmsg send-image ...
    |
    v
structured MCP content and error metadata
```

The process boundary reuses the same CLI paths as direct operation and prevents
the MCP layer from maintaining a second implementation of KakaoTalk automation.

## Local state

| Path | Purpose |
|---|---|
| `~/.config/kmsg/credentials.json` | Identifier, encrypted password, key identifier, schema, and timestamp. |
| `~/.config/kmsg/credentials/primary.key` | Local AES-GCM key material stored separately from the credential document. |
| `~/.kmsg/ax-cache.json` | Validated paths to frequently accessed AX elements. |
| `~/.kmsg/chat-registry.json` | Synthetic chat identities derived from local chat-list observations. |

Credential directories use owner-only `0700` permissions; credential and key
files use `0600`. Encryption protects the stored representation, but both the
ciphertext and its local key remain on the same machine.

AX cache entries use schema validation, a KakaoTalk version/build fingerprint,
a root fingerprint, candidate validation, and a seven-day TTL. An invalid or
stale entry falls back to discovery and is replaced or removed.

## Directory structure

```text
.
├── Package.swift
├── VERSION
├── VERSIONING.md
├── Plugins/
│   └── VersionGenPlugin/
├── Sources/
│   ├── VersionGenTool/
│   └── kmsg/
│       ├── Accessibility/
│       ├── Auth/
│       ├── Commands/
│       ├── KakaoTalk/
│       └── kmsg.swift
├── docs/
│   ├── openclaw.md
│   └── openclaw.mcp.example.json
├── tests/
├── tools/
│   ├── kmsg-mcp.py
│   └── sync_homebrew_tap.py
├── scripts/
│   └── headatever.sh
├── .github/workflows/
│   ├── ci.yml
│   └── release.yml
└── video/
```

`tools/kmsg-mcp.py` is a legacy/development reference implementation. The
installed integration entry point is the native `kmsg mcp-server` command.
`video/` contains promotional Remotion assets and is not part of the CLI
runtime.

## Design decisions

### Accessibility instead of a private protocol

KakaoTalk does not expose an official CLI. `kmsg` therefore interacts with the
same visible application UI a user operates, using Apple's Accessibility APIs.

This avoids implementing or reverse-engineering KakaoTalk's private LOCO
protocol. It does not make `kmsg` an official or risk-free integration:
service terms and enforcement remain Kakao's decision.

### Swift for a macOS-native executable

The implementation depends directly on `AppKit`, `ApplicationServices`,
`AXUIElement`, `CGEvent`, `CryptoKit`, and the pasteboard. Swift provides direct
access to those frameworks, native distribution, and Objective-C
interoperability without an additional runtime.

### Bounded discovery with self-healing fast paths

AX hierarchies are expensive and can change between KakaoTalk versions.
Discovery methods use limits and node budgets. Successful paths are cached, but
every cached result is revalidated before use; stale paths fall back to bounded
discovery.

### Explicit interaction modes

Normal commands may launch, activate, recover, search, resize, and close
windows. Background-safe reads opt into a narrower contract that forbids those
operations and succeeds only when a matching chat is already exposed.

Deep recovery is also opt-in for direct CLI commands. Fast paths remain the
default to avoid unnecessary relaunch and window manipulation.

### Local synthetic chat identity

KakaoTalk's Accessibility tree does not expose a durable public chat ID.
`kmsg chats` therefore generates a local `chat_id` from normalized names and
maintains collision records locally. It improves repeated lookup but is not a
remote identifier or a guarantee across machines.

### Output-channel separation

Structured command output is written to `stdout`. AX traces remain on
`stderr`, allowing JSON consumers and MCP subprocesses to parse output without
mixing diagnostic logs into payloads.

### Version source of truth

The root `VERSION` file is authoritative. A SwiftPM build-tool plugin validates
it and generates `BuildVersion` during compilation. Release tags use
`vMAJOR.YYMMDD.PATCH_COUNT`; the release workflow verifies that the universal
binary reports the same version before publishing it.

### Preserved project rationale

The following prose is preserved verbatim from the original Korean README.

<details>
<summary>원문 보기</summary>

#### 왜 Swift 로 만들었나요?

`kmsg` 는 macOS 전용 도구이고, 핵심 기능이 `AppKit`, `ApplicationServices`, `AXUIElement`, `CGEvent` 같은 macOS native API 위에 올라가 있습니다. Swift 는 이 API 들과의 연결이 가장 직접적이고 안정적이며, Objective-C 계열 프레임워크와의 상호운용도 자연스럽습니다.
반대로 Python 은 런타임/배포 의존성이 늘어나고, Rust 는 macOS framework binding 과 FFI 관리 복잡도가 커지기 때문에 현재 목적에는 Swift 쪽이 구현과 유지보수 모두 더 실용적이었습니다.

#### AX 가 뭔가요?

AX 는 macOS Accessibility(손쉬운 사용) API 를 뜻합니다. 앱의 창, 버튼, 입력창, 텍스트 같은 UI 요소를 `AXUIElement` 로 읽고 제어할 수 있게 해주는 시스템 인터페이스입니다.

#### 왜 AX 를 사용하나요?

KakaoTalk 은 공식적으로 CLI 를 제공하지 않습니다. 그래서 실제 사용자가 보고 클릭하는 UI 를 시스템 레벨에서 읽고 조작할 수 있는 현실적인 방법이 AX 입니다.
`kmsg` 의 채팅 목록 읽기, 검색, 메시지 전송, 이미지 전송, 창 제어가 모두 이 레이어 위에서 동작하기 때문에 Accessibility permission 이 필요합니다.

#### 왜 KakaoTalk 의 LOCO Protocol 을 사용하지 않나요?

LOCO Protocol 을 쓰려면 사실상 비공개 동작을 리버스 엔지니어링해야 하는데, 저는 이 접근이 명백한 약관 위반으로 해석될 여지가 크다고 봅니다. 실제로 이런 방식의 자동화나 비공식 프로토콜 사용과 관련해 계정이 영구정지된 사례도 이미 적지 않게 알려져 있어서, 기능적으로 가능하더라도 감수해야 하는 리스크가 너무 크다고 판단했습니다.

반면 AX 방식은 사용자가 실제로 보고 조작하는 KakaoTalk UI 를 macOS 의 공식 Accessibility API 로 읽고 제어하는 접근이라, 적어도 LOCO 를 직접 건드리는 방식보다는 상대적으로 안전할 것이라고 판단했습니다. 다만 이것도 어디까지나 제 개인적인 판단일 뿐이며, 카카오의 공식 입장이나 카카오 법무팀의 해석과는 다를 수 있습니다. 실제 약관 해석과 제재 기준은 카카오 측 판단이 우선합니다.

#### 이 기능을 Rust 로 작성하면 더 빨라질까요?

일부 구간은 빨라질 수 있지만, 체감 성능 향상은 제한적일 가능성이 큽니다. `kmsg` 의 주된 지연은 언어 런타임보다 `AXUIElement` 호출, UI 탐색, KakaoTalk 창 활성화/복구, 실제 앱 응답 시간에서 발생합니다.
Rust 로 바꾸면 단발 CLI cold start, 순수 stdio 프레이밍, JSON encode/decode 같은 좁은 구간은 유리할 수 있습니다. 하지만 MCP 서버처럼 프로세스가 이미 떠 있는 경로에서는 그 이득이 더 작아지고, 전체 end-to-end latency 는 여전히 macOS AX 와 KakaoTalk UI 응답 시간이 지배합니다. 대신 Rust 는 macOS native framework binding 과 FFI 관리 비용이 Swift 보다 커질 수 있습니다.

</details>
