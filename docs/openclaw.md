# OpenClaw Integration Guide

This guide explains the current `kmsg` + OpenClaw integration model.

## Core Model

There are two different interfaces:

- MCP, via `kmsg mcp-server`
- real-time streaming, via `kmsg watch "<chat>" --json`

Today, MCP is still request/response only. It exposes:

- `kmsg_read`
- `kmsg_send`
- `kmsg_send_image`

`watch` is not an MCP tool. If you want real-time auto-reply, run `watch --json` as a separate process and feed each event into OpenClaw or a small wrapper around it.

## Recommended Architecture

Use two processes:

1. `kmsg mcp-server`
2. `kmsg watch "채팅방 이름" --json`

The flow is:

1. `watch --json` emits a new KakaoTalk event
2. your supervisor passes that event to OpenClaw
3. OpenClaw drafts a reply
4. the reply is sent with `kmsg_send` through MCP, or `kmsg send` directly

This separation matters:

- MCP handles tool calls cleanly
- `watch` handles low-latency inbound detection
- you do not need a streaming MCP extension to operate today

## Prerequisites

- macOS with KakaoTalk installed
- Accessibility permission granted for `kmsg`
- `kmsg` installed and working

Check first:

```bash
kmsg --version
kmsg status
```

## MCP Setup

Run the MCP server:

```bash
kmsg mcp-server
```

Config example:

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

You can copy:

- `docs/openclaw.mcp.example.json`

## Real-Time Watch Setup

Run a dedicated watch process for the chat you want to automate:

```bash
kmsg watch "채팅방 이름" --json
```

`watch --json` emits one JSON object per detected event on `stdout`.

Example:

```json
{
  "chat": "홍길동",
  "detected_at": "2026-03-25T10:20:30.123Z",
  "event": "message",
  "message": {
    "author": "홍길동",
    "time_raw": "10:20",
    "body": "새 메시지"
  }
}
```

Notes:

- `watch` now defaults to 200ms polling
- startup uses a short warm-up to avoid backfill
- messages earlier than the watch start cutoff are suppressed
- `--trace-ax` logs stay on `stderr`

## Tool Contracts

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

Success shape:

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

- `confirm=false` or omitted sends immediately
- `confirm=true` does not send and returns `CONFIRMATION_REQUIRED`

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

## Operating Modes

### Recommended: Draft Then Approve

1. `watch --json` emits a message
2. OpenClaw drafts a reply
3. user approves
4. send with `kmsg_send`

This is the safest default because KakaoTalk is a personal chat surface and mistakes are expensive.

Minimal send call:

```json
{
  "name": "kmsg_send",
  "arguments": {
    "chat": "홍길동",
    "message": "검토 후 전송합니다.",
    "confirm": false
  }
}
```

### Advanced: Full Auto-Reply

1. `watch --json` emits a message
2. OpenClaw generates a reply automatically
3. your supervisor immediately calls `kmsg_send`

Use this only with guardrails. At minimum:

- ignore your own messages
- restrict to specific chat rooms
- add cooldown / loop protection
- log every outbound message

## Quick Start

Minimal manual setup:

```bash
kmsg mcp-server
```

In another process:

```bash
kmsg watch "채팅방 이름" --json
```

Then wire the watch events into OpenClaw and send replies through MCP `kmsg_send`.

## Troubleshooting

If watch fails:

- `kmsg watch "채팅방 이름" --json --trace-ax`
- `kmsg inspect --window 0 --depth 20`

If MCP fails:

- `kmsg mcp-server`
- `kmsg status`
- confirm Accessibility permission and KakaoTalk readiness
