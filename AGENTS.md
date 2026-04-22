# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
swift build                    # Debug build
swift build -c release         # Release build
.build/debug/kmsg [command]    # Run debug build
.build/release/kmsg [command]  # Run release build
```

## Testing

No automated test suite. Test manually:

```bash
.build/debug/kmsg status --verbose           # Check accessibility & app status
.build/debug/kmsg inspect --depth 5          # Inspect UI hierarchy
.build/debug/kmsg chats --verbose --limit 20 # List chats
.build/debug/kmsg send "Name" "msg" --dry-run # Test send without sending
.build/debug/kmsg read "Chat" --limit 50     # Read messages
```

## Architecture

```
CLI Commands (Commands/*.swift)
        ↓
  KakaoTalkApp (High-level business logic)
        ↓
    UIElement (Accessibility API wrapper)
        ↓
macOS Accessibility APIs (AXUIElement)
```

**Key components:**

- **UIElement** (`Accessibility/UIElement.swift`): Wrapper around `AXUIElement` with breadth-first search, attribute access, hierarchy traversal. Supports `limit` parameter for early termination.

- **KakaoTalkApp** (`KakaoTalk/KakaoTalkApp.swift`): Process lifecycle, window management, auto-launch with timeout. Thread-safe via `Sendable`.

- **Commands**: Each implements `ParsableCommand`. Handle CLI interaction, permission checks, delegate business logic to KakaoTalkApp.

## KakaoTalk UI Structure

```
Main Window (id: Main Window):
├── Navigation: id: friends, id: chatrooms, id: more
├── Unread count: AXStaticText
└── Content: AXScrollArea > AXTable > AXRow > AXCell

Chat Window (title = chat name):
├── Messages: AXScrollArea > AXTable > AXRow
└── Input: AXTextArea or AXTextField
```

## Technical Notes

- Bundle ID: `com.kakao.KakaoTalkMac`
- Requires Accessibility permission (System Settings > Privacy & Security > Accessibility)
- Keyboard input uses `CGEvent` for Korean text (Unicode support)
- Search methods support `limit` for early termination - use to avoid full UI traversal
- All classes interacting with accessibility APIs should be `Sendable`
- For version bumps, release tags, or release automation changes, follow `VERSIONING.md`

## Commit Convention

Follow conventional commits: `feat(module):`, `fix(module):`, `perf(module):`, `docs:`, `chore:`

Example: `feat(send): add chat list search and auto-open functionality`
