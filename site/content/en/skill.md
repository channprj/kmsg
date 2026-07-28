# kmsg coding agent Skill

The `kmsg` Skill guides Claude Code and Codex through the same safe workflow for
finding, reading, and sending KakaoTalk messages on macOS.

## Requirements

- macOS 13 or later
- KakaoTalk for macOS, signed in
- Accessibility permission for the installed `kmsg` binary

## Install the Skill

```bash
npx skills add channprj/kmsg --skill kmsg --agent claude-code codex -g -y
```

## Invoke it from an agent

| Agent | Invocation |
|---|---|
| Claude Code | `/kmsg` |
| Codex | `$kmsg` |

## Safe default workflow

1. Check permissions and sign-in status with `kmsg status --verbose`.
2. Confirm the exact chat name with `kmsg chats --limit 20`.
3. Read recent messages with `kmsg read "Chat name" --limit 20`.
4. Before sending, run `kmsg send "Chat name" "Message" --dry-run`.

## Use it with MCP

Use `kmsg watch --json` for long-running events and `kmsg mcp-server` for
request-and-response tools. See the [MCP guide](../mcp/) for configuration
details.

## Troubleshooting

If a command fails, check `kmsg status --verbose` and
`kmsg inspect --depth 5` first. See [Usage](../usage/) for all options.
