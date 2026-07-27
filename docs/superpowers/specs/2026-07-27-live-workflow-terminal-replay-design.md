# LIVE WORKFLOW terminal replay

Status: Approved through the visual-companion review and subsequent user
directives on 2026-07-27.

## Context

The homepage hero currently presents `kmsg watch` as a stylized
`WATCH → MCP → READY` dashboard. That composition is visually polished, but it
does not resemble the normal terminal experience of finding a chat, reading its
messages, and sending a reply with the CLI.

The replacement must show a truthful, continuous terminal session. It must also
remain stable when the homepage locale changes between Korean, English,
Japanese, and Simplified Chinese.

## Goals

- Replace the synthetic dashboard with a real terminal replay.
- Demonstrate the complete `kmsg chats → kmsg read → kmsg send` workflow.
- Use command syntax and output labels that match the current Swift CLI.
- Type commands character by character and reveal output line by line.
- Scroll only the terminal transcript when new output exceeds its viewport.
- Repeat the complete session automatically after holding the success state.
- Keep the outer terminal and hero geometry stable throughout every phase.
- Preserve readable wrapping with no horizontal page overflow in all four
  locales from 320px mobile through large desktop widths.
- Provide a complete static transcript when motion is reduced or JavaScript is
  unavailable.

## Selected direction

The approved direction is **Authentic Terminal Replay**.

The homepage keeps one terminal window with a normal `zsh` prompt. Commands and
output accumulate in the same scrollable transcript. There is no side rail,
MCP card, agent dashboard, simulated tool call, or other interface that the CLI
does not render.

The terminal header uses `kmsg · zsh`. A compact `01 / 03`, `02 / 03`, and
`03 / 03` indicator communicates which real command is running without
introducing a fictional application state.

## Session content

The replay uses the human-readable default output because it is easier to scan
on a product homepage and directly represents a person using the CLI.

### 1. Discover chats

```console
❯ kmsg chats --limit 2
Searching for chat list in KakaoTalk...

Found 2 chat(s):

[1] AI 프로젝트
    chat_id: chat_7f42c5e1d9ab
[2] 출시 준비
    chat_id: chat_81e0c8b9a214
```

The chat titles change by locale. Synthetic chat IDs keep a stable,
non-sensitive example format.

### 2. Read recent messages

```console
❯ kmsg read "AI 프로젝트" --limit 2 --keep-window
Reading messages from: AI 프로젝트

Recent messages (2):

[1] author: 지나
    time: 오후 1:41
    body: 새 메시지를 확인해줘.

[2] author: (me)
    time: 오후 1:42
    body: 지금 확인할게요.
```

`--keep-window` makes the displayed send sequence deterministic: the chat
window remains available for the next command.

### 3. Send the reply

```console
❯ kmsg send "AI 프로젝트" "확인했어요."
Looking for chat with 'AI 프로젝트'...
Found existing chat window.
✓ Message sent to 'AI 프로젝트'
✓ Chat window closed.
❯
```

These status lines match the successful existing-window path in
`SendCommand.swift`.

## Motion timeline

One loop lasts approximately 14 seconds:

1. Type `kmsg chats --limit 2` and submit it.
2. Reveal chat-list output line by line.
3. Type the `kmsg read` command and submit it.
4. Reveal two messages, scrolling the transcript as needed.
5. Type the `kmsg send` command and submit it.
6. Reveal lookup, existing-window, send-success, and close-success output.
7. Show the returned prompt and hold the complete state for about two seconds.
8. Dissolve only the transcript content, restore the empty prompt, and begin
   the next loop.

Typing uses Unicode code points rather than UTF-16 code units so Korean,
Japanese, and Chinese text is not split incorrectly. Output reveal timing is
line-based and does not depend on translated string length.

The whole terminal window does not flash, move, or collapse during a reset.
The existing subtle terminal arrival and hover treatment may remain, but it
must not compete with the session replay.

## Localization model

`site/build.mjs` owns the localized example data. Each homepage locale provides:

- primary and secondary chat titles;
- the visible sender;
- two incoming/outgoing message bodies;
- the reply body;
- display times suitable for the locale; and
- the localized accessible summary for the terminal illustration.

CLI command names, flags, and fixed output labels remain English because the
current executable prints them in English. User-controlled values are localized
inside the quoted command arguments and echoed output.

The four scenarios preserve the same semantic sequence and number of output
lines. Text length may vary, but it cannot change the outer component geometry.

## Responsive and locale-safe layout

The terminal uses one column at every viewport. Removing the current rail avoids
the narrow two-dimensional layout that is most likely to break with translated
copy.

The following rules are required:

- the terminal window and transcript viewport have stable block sizes for a
  given breakpoint;
- the transcript owns vertical overflow and the page never gains horizontal
  overflow;
- every transcript row and command text container uses `min-width: 0`;
- command and output text use `white-space: pre-wrap` and
  `overflow-wrap: anywhere`;
- prompts and status marks remain non-shrinking while adjacent text wraps;
- CJK text uses the site's locale-aware font fallbacks;
- font size may step down at existing mobile breakpoints but cannot become
  smaller merely because one locale is active;
- long commands wrap visually without changing their actual text; and
- resetting or switching phases cannot change the hero's outer height.

Browser verification covers 320, 390, 768, 1024, and 1440px widths for every
locale. At each width, `document.documentElement.scrollWidth` must not exceed
`clientWidth`, and the terminal must remain entirely within the viewport.

## Generated markup and progressive enhancement

`renderHomeHero` emits the entire completed transcript as semantic, ordered
markup. The transcript is decorative and stays inside the existing
`aria-hidden="true"` terminal visual, while the outer `role="img"` exposes one
localized summary.

The static HTML is the fallback. It shows a readable completed session before
JavaScript runs and if JavaScript fails.

`site/src/app.js` progressively enhances each `[data-terminal-replay]`:

1. capture the complete text and ordered replay instructions;
2. enable replay styling only after initialization succeeds;
3. reset the internal transcript;
4. type command text and reveal output rows according to the timeline;
5. scroll the transcript to its newest content;
6. hold the completion state and repeat; and
7. restore the complete static state if replay throws.

The controller is scoped to the terminal component and does not own homepage
layout, locale navigation, theme controls, or generated content.

## Lifecycle and error handling

- `IntersectionObserver` starts replay only while the hero terminal is near the
  viewport.
- `visibilitychange` pauses work while the page is backgrounded and restarts a
  clean loop when the page becomes visible.
- Only one loop may run per terminal instance.
- Timers are cancelled before resets and when replay is paused.
- Missing replay nodes are a no-op.
- An initialization or runtime exception removes the enhanced state and restores
  the complete transcript.
- If `IntersectionObserver` is unavailable, the complete static transcript
  remains visible.
- Theme and locale navigation continue to work independently of replay state.

## Motion accessibility

When `prefers-reduced-motion: reduce` matches, the controller does not start.
The completed transcript and returned prompt remain visible without typing,
reveal, scroll, blink, scan, arrival, hover-lift, or reset animation.

The existing global reduced-motion rule remains the final CSS safeguard.
Runtime media-query changes must switch safely between the completed static
state and a fresh replay without duplicating timers.

Because the replay is decorative, it does not emit repeated live-region
announcements. The localized `aria-label` communicates the same high-level
meaning once to assistive technology.

## Verification

Automated site tests must prove:

- every locale renders the same three commands in order;
- localized chat names, message bodies, replies, and accessible labels appear;
- the fictional `kmsg watch`, `WATCH`, `MCP`, and `READY` dashboard is absent;
- replay hooks and the complete static fallback are present;
- the CSS contains locale-safe wrapping, fixed transcript geometry, internal
  overflow, and reduced-motion behavior;
- the controller accounts for viewport intersection, page visibility, runtime
  reduced-motion changes, cancellation, and fallback restoration; and
- the existing locale, SEO, documentation, copy, theme, and route tests remain
  green.

Browser verification must prove:

- the animation visibly progresses through all three commands in order;
- the terminal scrolls internally while the page stays fixed;
- the completion state is readable before reset;
- the loop restarts without duplicate content or layout movement;
- reduced motion shows the final static transcript;
- page-level horizontal overflow is zero at all required locale/viewport
  combinations;
- the terminal bounds stay inside the viewport;
- the outer terminal dimensions stay stable across replay phases; and
- theme and locale controls still work while the replay is running.

Screenshots are captured for Korean, English, Japanese, and Chinese at desktop
and mobile sizes. Runtime measurements, not screenshots alone, prove overflow
and geometry invariants.

## Realtime checkpoint strategy

1. Commit and push this approved design as
   `docs(site): define live workflow terminal replay`.
2. Implement the localized static transcript, replay controller, responsive
   styling, and coupled regression tests as one usable feature checkpoint:
   `feat(site): replay real CLI messaging workflow`.
3. Create and push a separate corrective checkpoint only if full browser
   verification exposes a real defect after the feature checkpoint.

Each checkpoint must pass its relevant checks, `git diff --check`, an explicit
secret-path review, ordinary push, and upstream parity `0 0`.

## Non-goals

- No change to the Swift CLI, command output, KakaoTalk automation, or MCP
  server.
- No framework migration, animation dependency, client-side router, or video
  asset.
- No interactive terminal input, command execution, or user-provided message
  submission on the website.
- No change to canonical locale routes, themes, documentation content, release
  version, tag, or deployment workflow.
