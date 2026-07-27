---
name: kmsg
description: Use KMSG to read, watch, and send KakaoTalk messages safely from a coding agent. Use whenever the user mentions KakaoTalk or kmsg and wants chat discovery, recent messages, monitoring, text or image delivery, setup checks, or CLI troubleshooting. Do not use for other messaging platforms or private KakaoTalk protocol work.
compatibility: Requires macOS 13+, KakaoTalk for macOS, and kmsg available on PATH.
---

# KMSG

Operate the local KakaoTalk app through `kmsg` while keeping recipients,
message contents, and external side effects explicit.

Claude Code users can invoke this skill with `/kmsg`; Codex users can invoke it
with `$kmsg`. Both agents may also select it automatically when the request
matches the description.

## Safety boundary

- Treat chat names and message contents as private. Return only the information
  needed for the user's request.
- `send` and `send-image` change external state. Run them only when the user
  explicitly asked or authorized you to send that exact content to that exact
  destination.
- A request to draft, rewrite, preview, or prepare a message is not permission
  to send it. Return the draft or stop after the dry run.
- Preserve the user's message verbatim unless they asked you to edit it.
- If the intended chat or recipient is ambiguous, stop and ask the user to
  choose. Never guess from a partial name.
- Never retry an actual send after an uncertain result. Read the target chat to
  verify delivery first so the message is not sent twice or duplicated.

## 1. Run one preflight

Confirm that the binary exists, then check KakaoTalk, Accessibility, and
authentication readiness:

```bash
command -v kmsg
kmsg status
```

Do this once per task rather than before every command. If `kmsg` is missing,
recommend:

```bash
brew install channprj/tap/kmsg
```

If status is not ready, report the failed requirement and the remediation
printed by `kmsg`. Do not change stored credentials with `kmsg auth login`
unless the user asked for setup or authorized a login.

## 2. Resolve chats before acting

Prefer structured output and stable `chat_id` values:

```bash
kmsg chats --json
```

Match an exact chat title when possible. If there is one clear match, reuse its
`chat_id` for reading and text sending. If multiple entries could match, show
the minimal identifying choices and wait for the user to select one.

## 3. Read only what was requested

Use a stable ID and JSON for agent parsing:

```bash
kmsg read --chat-id "<chat_id>" --limit 20 --json
```

Adjust `--limit` to the request. Summarize by default; include raw message
content only when the user asks for it.

When the user explicitly wants zero focus changes, add `--background-safe`.
This mode only reads an already exposed matching window and can fail instead of
opening or moving KakaoTalk:

```bash
kmsg read --chat-id "<chat_id>" --limit 20 --json --background-safe
```

## 4. Watch for new messages

`watch` currently accepts a chat name rather than `chat_id`:

```bash
kmsg watch "<chat>" --json
```

Use an exact title. Keep the process bounded by the requested condition or
duration, and stop or terminate the watch process when the task ends. Do not
leave an orphaned watcher running. Add `--include-system` only when the user
needs date separators or other system events.

## 5. Send text with a dry run first

Resolve the chat, preserve the message as one literal argument, and preview the
exact action:

```bash
kmsg send --chat-id "<chat_id>" "<message>" --dry-run
```

Inspect the dry-run output for the intended ID and exact text. Then:

- If the user explicitly asked, requested, or authorized the actual send,
  execute it once:

  ```bash
  kmsg send --chat-id "<chat_id>" "<message>"
  ```

- If the user asked for a draft or preview, report the dry run and stop.
- If recipient or content changed after the dry run, run a new dry run.

When the message contains quotes, dollar signs, backticks, or newlines, use the
execution tool's argument-array form when available. Do not build an
interpolated shell command that could alter the message or execute its content.

## 6. Send an image only with explicit intent

Verify that the file exists, is the intended image, and has an absolute path.
Then use:

```bash
kmsg send-image "<recipient>" "/absolute/path/to/image.png"
```

`send-image` has no dry-run or preview mode. Because it sends immediately, do
not run it for draft or preview requests. It also accepts a recipient name
rather than `chat_id`; do not send when duplicate or ambiguous names exist.

## 7. Diagnose without widening the action

Use the narrowest recovery step:

1. Re-run the failed command with `--trace-ax`.
2. Add `--deep-recovery` only when normal window detection failed.
3. Use `kmsg inspect --depth 5` for UI hierarchy diagnosis.
4. Use `kmsg cache` commands only when trace output identifies a stale AX path.

Do not convert a failed read or dry run into an actual send. Report the command,
exit status, and actionable error without exposing unrelated chat content.

## Completion report

State:

- which chat was targeted (title and shortened `chat_id` when available);
- whether the operation was read, watch, dry-run, or actual send;
- the number of messages read or events observed; and
- any readiness or ambiguity that prevented the requested action.

Never claim a message or image was delivered unless the actual command
succeeded. A successful dry run proves only the preview.
