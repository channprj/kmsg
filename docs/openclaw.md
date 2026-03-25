# OpenClaw Integration Guide

This guide shows how to connect `kmsg` to OpenClaw through MCP.

## Overview

The recommended MCP stdio server entrypoint is:

- `kmsg mcp-server`

It exposes 3 tools:

- `kmsg_read`: reads KakaoTalk messages using `kmsg read --json`
- `kmsg_send`: sends KakaoTalk messages using `kmsg send`
- `kmsg_send_image`: sends KakaoTalk images using `kmsg send-image`

For streaming use cases such as an external auto-reply supervisor, use the CLI directly:

```bash
kmsg watch "채팅방 이름" --json
```

Current MCP integration remains request/response only. `watch` is the streaming primitive.

## Prerequisites

- macOS with KakaoTalk installed
- Accessibility permission granted for `kmsg`
- `kmsg` binary installed and executable
Check first:

```bash
kmsg --version
kmsg status
```

## Run MCP server manually

```bash
kmsg mcp-server
```

Optional environment variables:

- `KMSG_DEFAULT_DEEP_RECOVERY`: `true` or `false`
- `KMSG_TRACE_DEFAULT`: `true` or `false`

## OpenClaw MCP config example

Use your OpenClaw MCP config file and register this server:

```json
{
  "mcpServers": {
    "kmsg": {
      "command": "kmsg",
      "args": ["mcp-server"],
      "env": {
        "KMSG_DEFAULT_DEEP_RECOVERY": "false",
        "KMSG_TRACE_DEFAULT": "false"
      }
    }
  }
}
```

You can also copy and edit:

- `docs/openclaw.mcp.example.json`

## Tool contracts

## `kmsg_read`

Input:

```json
{
  "chat": "채팅방 이름",
  "limit": 20,
  "deep_recovery": false,
  "keep_window": false,
  "trace_ax": false
}
```

Success output shape:

```json
{
  "ok": true,
  "chat": "채팅방 이름",
  "fetched_at": "2026-02-26T03:10:10.123Z",
  "count": 20,
  "messages": [
    {
      "author": "홍길동",
      "time_raw": "00:27",
      "body": "밤이 깊었네"
    }
  ],
  "meta": {
    "latency_ms": 1820
  }
}
```

## `kmsg_send`

Input:

```json
{
  "chat": "채팅방 이름",
  "message": "테스트 메시지",
  "confirm": false,
  "deep_recovery": false,
  "keep_window": false,
  "trace_ax": false
}
```

Notes:

- Default behavior sends immediately (`confirm=false` or omitted).
- `confirm=true` blocks sending and returns `CONFIRMATION_REQUIRED`.

## `kmsg_send_image`

Input:

```json
{
  "chat": "채팅방 이름",
  "image_path": "/path/to/image.png",
  "confirm": false,
  "deep_recovery": false,
  "keep_window": false,
  "trace_ax": false
}
```

Notes:

- Default behavior sends immediately (`confirm=false` or omitted).
- `confirm=true` blocks sending and returns `CONFIRMATION_REQUIRED`.

## Error model

All tools return structured errors with:

- `ok: false`
- `error.code`
- `error.message`
- `error.hint`
- `error.raw_stdout`
- `error.raw_stderr`
- `meta.latency_ms`

Common `error.code` values:

- `CHAT_NOT_FOUND`
- `KMSG_BIN_NOT_FOUND`
- `KAKAO_WINDOW_UNAVAILABLE`
- `ACCESSIBILITY_PERMISSION_DENIED`
- `PROCESS_TIMEOUT`
- `INVALID_JSON_OUTPUT`
- `CONFIRMATION_REQUIRED`
- `UNKNOWN_EXEC_FAILURE`

## Recommended prompting pattern in OpenClaw

1. Use `kmsg_read` to fetch latest context.
2. Draft reply.
3. Ask user for approval.
4. Send with `kmsg_send` / `kmsg_send_image` using `confirm=false` (or omit `confirm`).
5. If you want to force an extra confirmation step before send, call with `confirm=true` first.

## Troubleshooting

If `kmsg_read` fails:

1. Run manually with trace:
   - `kmsg read "채팅방" --json --trace-ax --deep-recovery`
2. Inspect UI tree:
   - `kmsg inspect --window 0 --depth 20`
3. Keep KakaoTalk visible and responsive during tool calls.

If MCP startup check reports failure, run `kmsg status` directly and confirm Accessibility permission / KakaoTalk readiness.
