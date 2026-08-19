# kmsg Usage

This guide covers installation, first-run setup, every public CLI command,
configuration, output formats, MCP operation, troubleshooting, and release
maintenance.

## Installation

### Requirements

- macOS 13 or later
- KakaoTalk for macOS
- Accessibility permission for the installed `kmsg` binary

### Homebrew

```bash
brew install channprj/tap/kmsg
```

The tap publishes `kmsg` for the latest release and retains exact-version
formulae for the ten most recent published releases.

Update an existing installation with:

```bash
kmsg update
```

`kmsg update` installs Homebrew when it is missing, installs or upgrades the
formula, and links a directly installed binary to the Homebrew-managed command.
The plain Homebrew equivalent is `brew update` followed by `brew upgrade kmsg`.

### Direct download

The release workflow publishes a universal macOS binary named
`kmsg-macos-universal`.

```bash
mkdir -p ~/.local/bin
curl -fL \
  https://github.com/channprj/kmsg/releases/latest/download/kmsg-macos-universal \
  -o ~/.local/bin/kmsg
chmod +x ~/.local/bin/kmsg
```

Ensure `~/.local/bin` is in `PATH`, then verify the binary:

```bash
kmsg --version
```

Run `kmsg update` later to move this binary onto the Homebrew-managed release.

### Build from source

Source builds require Swift 6.

```bash
git clone https://github.com/channprj/kmsg.git
cd kmsg
swift build -c release
install -m 755 .build/release/kmsg ~/.local/bin/kmsg
```

## Quick start

Run the environment check first:

```bash
kmsg status
```

macOS may open the Accessibility settings pane. Enable the binary you actually
run, then retry `kmsg status`.

List chats and read recent messages:

```bash
kmsg chats
kmsg read "Chat name" --limit 20
```

Preview a send without changing KakaoTalk:

```bash
kmsg send "Chat name" "Hello" --dry-run
```

After verifying the target and message, omit `--dry-run` to send.

## Authentication

Commands that require interactive KakaoTalk access automatically check the
login state. If saved credentials are unavailable, `kmsg` prompts in the
terminal and stores them locally.

Enter fresh credentials explicitly:

```bash
kmsg auth login
```

Reuse stored credentials when available:

```bash
kmsg auth login --auto
```

Add `--trace-ax` to print Accessibility traversal and retry diagnostics.

The password is encrypted with AES-GCM. The credential document and encryption
key are stored separately with owner-only filesystem permissions:

```text
~/.config/kmsg/credentials.json
~/.config/kmsg/credentials/primary.key
```

### Lock mode

When KakaoTalk's lock screen is showing, commands unlock it before continuing.
The lock passcode is set inside KakaoTalk and is separate from the account
password, so `kmsg` prompts for it once and then stores it encrypted next to
the account credentials.

Only one unlock attempt is made per command, because KakaoTalk signs the
account out after repeated wrong passcodes. If the passcode is rejected, the
stored value is discarded and the next command prompts for it again.

Callers without a terminal — `kmsg mcp-server`, `kmsg watch`, cron jobs — cannot
prompt. Unlock once from a terminal so the passcode is saved, and they unlock on
their own from then on.

## Command reference

### Global behavior

```bash
kmsg
kmsg --help
kmsg --version
kmsg -v
```

Running `kmsg` without a subcommand runs `status`.

### `status`

```bash
kmsg status [--verbose]
```

Checks Accessibility permission, launches KakaoTalk if needed, verifies
authentication, and prints readiness information.

| Option | Description |
|---|---|
| `--verbose` | Include window titles, indexes, positions, and sizes. |

### `auth login`

```bash
kmsg auth login [--auto] [--trace-ax]
```

| Option | Description |
|---|---|
| `--auto` | Use stored credentials when available; otherwise prompt and save. |
| `--trace-ax` | Print AX traversal and retry details to `stderr`. |

Without `--auto`, the command prompts for fresh credentials and replaces the
stored values.

### `chats`

```bash
kmsg chats [options]
```

| Option | Description |
|---|---|
| `-v`, `--verbose` | Include the last visible message preview. |
| `-l N`, `--limit N` | Return at most `N` chats. Default: `20`. |
| `--trace-ax` | Print AX traversal and retry details. |
| `--json` | Return one structured JSON document. |
| `-k`, `--keep-window` | Keep a chat-list window that the command opened. |

Each result includes a local synthetic `chat_id`. The registry is refreshed by
running `kmsg chats` and stored at `~/.kmsg/chat-registry.json`.

### `read`

```bash
kmsg read <chat> [options]
kmsg read --chat-id <chat-id> [options]
```

A chat name and `--chat-id` are mutually exclusive.

| Option | Description |
|---|---|
| `--chat-id ID` | Resolve a synthetic ID produced by `kmsg chats`. |
| `-l N`, `--limit N` | Maximum messages to return. Default: `20`. |
| `--debug` | Show compact raw parsing information in text output. |
| `--trace-ax` | Print AX traversal and retry details. |
| `-k`, `--keep-window` | Keep a chat window opened by the command. |
| `--background-safe` | Read only an already exposed matching window without launching, activating, logging in, searching, opening, resizing, or closing UI. |
| `--deep-recovery` | Enable deeper window recovery after the fast path fails. |
| `--layout MODE` | Use `preserve`, `left`, `right`, `split-left`, or `split-right`. Default: `preserve`. |
| `--json` | Return one structured JSON document. |

The name form supports partial matching. For repeated automation, use a
`chat_id` after refreshing the registry with `kmsg chats`.

`--background-safe` is suitable for automation that must not disturb foreground
work, but it fails unless the matching chat window is already exposed.

#### If `--background-safe` is missing

The CLI flag is available in kmsg `v1.260618.0` and later, and belongs only to
the `kmsg read` command. Check the binary that your shell actually resolves:

```bash
kmsg --version
kmsg read --help
```

If the help output does not list the flag, update the Homebrew installation and
check again:

```bash
brew update
brew upgrade kmsg
kmsg read --help
```

MCP clients use the JSON argument `background_safe: true` instead of the CLI
spelling `--background-safe`.

Messages whose author cannot be resolved are represented as `"(me)"`.

### `watch`

```bash
kmsg watch <chat> [options]
```

| Option | Description |
|---|---|
| `--poll-interval S` | Poll interval in seconds. Default: `0.2`; values are clamped to `0.2...10.0`. |
| `--trace-ax` | Print AX traversal and recovery details. |
| `-k`, `--keep-window` | Keep a chat window opened by the command. |
| `--deep-recovery` | Enable deeper recovery when fast window detection fails. |
| `--json` | Emit each event as a separate pretty-printed JSON object. |
| `--include-system` | Include system rows such as date separators. |

At startup, `watch` stabilizes a transcript baseline for up to two seconds and
does not replay the existing history. Rows that cannot be assigned a safe
timestamp may be suppressed during startup.

Stop the process with Ctrl-C or `SIGTERM`.

### `send`

```bash
kmsg send <recipient> <message> [options]
kmsg send --chat-id <chat-id> <message> [options]
```

| Option | Description |
|---|---|
| `--chat-id ID` | Resolve a synthetic ID produced by `kmsg chats`. |
| `--dry-run` | Print the target and message without accessing or changing KakaoTalk. |
| `--trace-ax` | Print AX traversal and retry details. |
| `--no-cache` | Disable AX path cache use for this invocation. |
| `--refresh-cache` | Remove relevant cached paths before sending. |
| `-k`, `--keep-window` | Keep chat and list windows opened by the command. |
| `--deep-recovery` | Enable deeper recovery after the fast path fails. |

Without `--keep-window`, windows opened transiently by the command are closed
after the send attempt.

### `send-image`

```bash
kmsg send-image <recipient> <image-path> [options]
```

| Option | Description |
|---|---|
| `--trace-ax` | Print AX traversal and retry details. |
| `--no-cache` | Disable AX path cache use for this invocation. |
| `-k`, `--keep-window` | Keep chat and list windows opened by the command. |
| `--deep-recovery` | Enable deeper recovery after the fast path fails. |

The path must point to a readable image. `kmsg` loads the image into the macOS
pasteboard and completes KakaoTalk's image-send UI.

### `inspect`

```bash
kmsg inspect [options]
```

| Option | Description |
|---|---|
| `-d N`, `--depth N` | Maximum hierarchy depth. Default: `4`. |
| `-w N`, `--window N` | Inspect a window by zero-based index. |
| `--show-attributes` | Print available AX attributes. |
| `--show-path` | Print the hierarchy path. |
| `--show-frame` | Print element frames. |
| `--show-index` | Print sibling indexes. |
| `--show-flags` | Print enabled, focused, selected, and editable state. |
| `--show-actions` | Print supported AX actions. |
| `--debug-layout` | Enable path, frame, index, and state output together. |
| `--row-summary` | Print message-row parsing diagnostics. |
| `--row-range A:B` | Limit row summaries to an inclusive zero-based range. |

`--row-range` applies only with `--row-summary`.

### `cache`

```bash
kmsg cache
kmsg cache status
kmsg cache clear
kmsg cache export <output-path>
kmsg cache import <input-path>
kmsg cache warmup [options]
```

Running `kmsg cache` without a subcommand runs `cache status`.

| Subcommand | Description |
|---|---|
| `status` | Show path, schema, KakaoTalk fingerprint, entry count, and update time. |
| `clear` | Delete the local AX path cache. |
| `export PATH` | Export the current cache document as JSON. |
| `import PATH` | Import JSON after schema and KakaoTalk fingerprint validation. |
| `warmup` | Discover and store common chat-list, search, and input paths. |

`cache warmup` accepts:

| Option | Description |
|---|---|
| `--recipient NAME` | Also warm the chat-open and message-input path for a recipient. |
| `--trace-ax` | Print AX traversal and retry details. |
| `-k`, `--keep-window` | Keep a chat window opened by warmup. |

### `mcp-server`

```bash
kmsg mcp-server
```

Starts the native stdio MCP server. It accepts both `Content-Length` framing and
one JSON-RPC request per line, and responds using the request's transport style.

The server exposes:

| Tool | Purpose |
|---|---|
| `kmsg_read` | Read by `chat` or `chat_id`, with limit, layout, recovery, background-safe, window, and trace controls. |
| `kmsg_send` | Send a text message by chat name. |
| `kmsg_send_image` | Send a local image by chat name. |

For send tools, `confirm=false` or an omitted `confirm` sends immediately.
`confirm=true` does not send; it returns `CONFIRMATION_REQUIRED` so a supervisor
can request approval and call again.

See [docs/openclaw.md](docs/openclaw.md) for complete integration examples.

### `update`

```bash
kmsg update
```

Moves the current installation onto the Homebrew-managed release:

1. Finds `brew` on `PATH`, at `/opt/homebrew/bin/brew`, or at
   `/usr/local/bin/brew`, and runs Homebrew's official installer when none of
   them exists.
2. Runs `brew install` or `brew upgrade` for `channprj/tap/kmsg`.
3. Verifies the resulting binary by running it with `--version`.
4. Replaces a directly installed `kmsg` with a link to the verified binary, so
   the path the shell already resolved keeps working. A build product under
   `.build` is never replaced.

Progress goes to `stderr` and the final summary to `stdout`. Homebrew or `sudo`
may ask for confirmation. The command needs no Accessibility permission and
never edits shell startup files.

## JSON output

### Chats

```bash
kmsg chats --json
```

```json
{
  "count": 1,
  "chats": [
    {
      "title": "홍길동",
      "chat_id": "chat_7f42c5e1d9ab",
      "last_message": "곧 도착해요"
    }
  ]
}
```

### Read

```bash
kmsg read "홍길동" --limit 20 --json
```

```json
{
  "chat": "홍길동",
  "fetched_at": "2026-02-26T01:23:45.678Z",
  "count": 1,
  "messages": [
    {
      "author": "홍길동",
      "time_raw": "00:27",
      "date": "2026-02-26",
      "body": "밤이 깊었네",
      "has_image": false,
      "image_count": 0,
      "link_count": 0,
      "has_attachment": false,
      "attachment_count": 0
    }
  ]
}
```

`date` and `time_raw` may be absent when KakaoTalk does not expose the
corresponding metadata.

### Watch

```bash
kmsg watch "홍길동" --json
```

```json
{
  "chat": "홍길동",
  "detected_at": "2026-03-25T10:20:30.123Z",
  "event": "message",
  "message": {
    "author": "홍길동",
    "time_raw": "10:20",
    "body": "새 메시지",
    "has_image": false,
    "image_count": 0,
    "link_count": 0,
    "has_attachment": false,
    "attachment_count": 0
  }
}
```

With `--include-system`, `event` may be `"system"`.

JSON payloads are written to `stdout`. `--trace-ax` diagnostics remain on
`stderr`.

## Configuration

### Environment variables

| Variable | Default | Behavior |
|---|---:|---|
| `KMSG_AX_TIMEOUT` | `0.25` | AX messaging timeout in seconds. Accepted range: `0.05...5.0`; invalid values fall back to the default. |
| `KMSG_DEFAULT_DEEP_RECOVERY` | `false` | Default `deep_recovery` value for MCP tools. |
| `KMSG_DEFAULT_BACKGROUND_SAFE` | `false` | Default `background_safe` value for `kmsg_read`. |
| `KMSG_TRACE_DEFAULT` | `false` | Default `trace_ax` value for MCP tools. |
| `KMSG_DEFAULT_READ_LAYOUT` | `preserve` | Default MCP read layout: `preserve`, `left`, `right`, `split-left`, or `split-right`. |
| `KMSG_MCP_STARTUP_STATUS_CHECK` | `false` | When `true`, MCP initialization also runs `kmsg status`; otherwise it checks only the binary version. |
| `KMSG_MCP_VERSION` | build version | Overrides MCP server version metadata. |

Example:

```bash
KMSG_DEFAULT_BACKGROUND_SAFE=true \
KMSG_DEFAULT_READ_LAYOUT=split-right \
kmsg mcp-server
```

### Local state

| Path | Contents |
|---|---|
| `~/.config/kmsg/credentials.json` | Encrypted credential document. |
| `~/.config/kmsg/credentials/primary.key` | Local AES-GCM key. |
| `~/.kmsg/chat-registry.json` | Synthetic chat identities. |
| `~/.kmsg/ax-cache.json` | Self-healing AX paths. |

Do not publish these files or include their contents in issue reports.

## Examples

Read without disturbing foreground windows:

```bash
kmsg read "홍길동" --json --background-safe
```

Read by synthetic ID and arrange the window on the right:

```bash
kmsg chats --json
kmsg read --chat-id "chat_7f42c5e1d9ab" \
  --layout split-right \
  --limit 50 \
  --json
```

Watch for new messages:

```bash
kmsg watch "홍길동" --json --poll-interval 0.5
```

Preview and then send:

```bash
kmsg send "홍길동" "안녕하세요" --dry-run
kmsg send "홍길동" "안녕하세요"
```

Warm and inspect the AX cache:

```bash
kmsg cache warmup --recipient "홍길동" --trace-ax
kmsg cache status
```

Collect parsing diagnostics:

```bash
kmsg inspect --window 0 --depth 20 --debug-layout
kmsg inspect --window 0 --depth 20 --row-summary --row-range 10:30
kmsg read "홍길동" --limit 20 --trace-ax
```

## Troubleshooting

### Accessibility permission is not granted

1. Run `kmsg status`.
2. Open **System Settings → Privacy & Security → Accessibility**.
3. Add or enable the exact `kmsg` binary you run.
4. Retry `kmsg status`.

A rebuilt or moved binary may need to be added again.

### KakaoTalk cannot be launched or has no usable window

Open KakaoTalk manually, complete login if necessary, and run:

```bash
kmsg status --verbose
```

Use `--deep-recovery` only when the normal fast path cannot recover a window.

### A chat name or `chat_id` is not found

Refresh local identities:

```bash
kmsg chats --json
```

A renamed room receives a new local identity. If duplicate rooms have the same
name, prefer the `chat_id` values produced from the current chat list.

### Background-safe read fails

`--background-safe` never opens or searches for a chat. Expose the target chat
window first, or omit the flag when foreground automation is acceptable.

### Messages cannot be parsed

Collect both hierarchy and trace evidence:

```bash
kmsg inspect --window 0 --depth 20 --row-summary
kmsg read "Chat name" --trace-ax
```

Attach the relevant output to an issue after removing private message content.

### Cached paths appear stale

```bash
kmsg cache status
kmsg cache clear
```

Verify target and message parsing without touching KakaoTalk:

```bash
kmsg send "Chat name" "Test" --dry-run
```

`--dry-run` exits before KakaoTalk access. If a real test send is acceptable,
retry that send with `--no-cache` to compare the uncached UI path:

```bash
kmsg send "Chat name" "Test" --no-cache
```

### MCP initialization fails

Verify the binary directly:

```bash
kmsg --version
kmsg status
kmsg mcp-server
```

The MCP server skips the interactive status check by default. Set
`KMSG_MCP_STARTUP_STATUS_CHECK=true` only when startup should validate full
KakaoTalk readiness.

## Development and releases

Build debug and release variants:

```bash
swift build
swift build -c release
.build/debug/kmsg --version
```

Useful manual checks:

```bash
.build/debug/kmsg status --verbose
.build/debug/kmsg inspect --depth 5
.build/debug/kmsg chats --verbose --limit 20
.build/debug/kmsg send "Name" "Message" --dry-run
.build/debug/kmsg read "Chat" --limit 50
```

The root `VERSION` file is managed through Headatever-backed make targets:

```bash
make version
make release
make release-major
make release-push
```

Do not hand-edit `VERSION`. See [VERSIONING.md](VERSIONING.md) for the
`MAJOR.YYMMDD.PATCH_COUNT` rules.

Pushing a matching `v*` tag triggers the release workflow, which:

1. Builds arm64 and x86_64 release binaries.
2. combines them as `kmsg-macos-universal`;
3. verifies the embedded version against the tag;
4. creates or updates the GitHub Release; and
5. synchronizes the required Homebrew tap metadata.
