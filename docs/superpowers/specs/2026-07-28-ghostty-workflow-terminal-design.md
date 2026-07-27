# Ghostty-style workflow terminal

Status: Approved by the user on 2026-07-28.

## Context

The homepage workflow replay currently sits inside a product-style double frame
with a labeled progress row, a three-column title bar, a ruled background, and
a footer status bar. Its `48px` title bar, `45px` footer, `1.42` line height,
large command gaps, and decorative chrome make the transcript look more like a
dashboard mockup than a real terminal.

The user selected a Ghostty-first direction. The replacement must retain the
truthful `kmsg chats → kmsg read → kmsg send` replay while making the window
closely resemble a compact Ghostty terminal on macOS.

## Goals

- Remove the following visible homepage content:
  - `실제 CLI 흐름` and every localized equivalent;
  - `kmsg · zsh`;
  - every visible `v1.260726.0` release label, including the hero, terminal
    title bar, and homepage footer;
  - `AX 연결됨` and every localized equivalent; and
  - `텍스트 · 표준 출력` and every localized equivalent.
- Remove the visible replay progress counter because it is not terminal output.
- Use a single macOS terminal window rather than a framed product screenshot.
- Match Ghostty's dark, native, low-chrome presentation.
- Make transcript rows and command groups substantially denser.
- Preserve the real localized replay, reduced-motion fallback, internal
  scrolling, and four-locale responsive behavior.
- Keep the page free of horizontal overflow from 320px through large desktop
  widths.

## Selected direction

The approved direction is **Ghostty-first native terminal**.

The terminal uses a flat `#282c34` surface, a transparent-style macOS title bar,
visible traffic-light controls, and JetBrains Mono. The title bar contains no
session title, version, tab label, status indicator, or replay metadata.

The terminal remains dark in both website themes. The surrounding page may
switch between dark and paper themes, but the terminal represents a real dark
application window rather than inheriting the documentation palette.

## Markup and content

`renderHomeWorkflow` no longer renders `.workflow-meta`,
`data-replay-progress`, or `aria-labelledby="workflow-title"`. The localized
`workflowLabel` fields are removed from `homeContent` because they have no
remaining consumer.

The homepage hero no longer renders `.hero-version`, and the localized
`currentVersion` fields are removed from `homeContent`. The homepage footer
omits its versioning link because that link uses the release number as its
visible label. Documentation pages retain the versioning link, and the release
number remains in structured metadata and machine-readable discovery files.

The workflow section keeps `data-replay-scope` for replay lifecycle scoping. Its
`.workflow-frame` becomes a layout wrapper only. The existing localized
`role="img"` label on the terminal frame remains the accessible summary.

`renderWorkflowTerminal` no longer accepts the release version. It renders:

1. a title bar containing only the three macOS traffic-light controls;
2. the existing transcript viewport and complete static replay; and
3. no footer.

The locale-specific `terminalCopy` object is removed together with the footer.
Removing the shared markup removes all translated title and status variants,
not only the Korean strings.

## Ghostty visual system

### Window chrome

- One `1px` neutral border and a `10px` to `12px` macOS window radius.
- A restrained macOS shadow without yellow glow.
- A `36px` title bar using the same `#282c34` surface as the terminal.
- Three `10px` traffic lights with native red, amber, and green colors.
- No outer border, padding, raised panel, hover lift, scan beam, or decorative
  second frame.

### Terminal surface

- Background: `#282c34`.
- Primary foreground: `#ffffff`.
- Normal output: a soft cool gray close to `#d7dae0`.
- Muted output: `#7f848e`.
- Highlighted values: `#61afef`.
- Success output: `#98c379`.
- Prompt and cursor accent: `#e5c07b`.
- No horizontal-rule texture, gradient, translucency, or page-theme color
  mixing inside the terminal.

### Typography and density

The site font request includes JetBrains Mono for the workflow terminal. The
terminal-specific stack starts with `"JetBrains Mono"` and falls back to the
existing macOS monospace stack.

- Desktop font size: `13px`.
- Tablet and mobile font size: `12px`.
- Very narrow mobile font size: `11px`.
- Line height: `1.18` at every breakpoint.
- Transcript padding: approximately `10px 12px 12px`.
- Command-to-command top gap: no more than `7px`.
- Explicit output spacer: no more than `3px`.
- Prompt-to-command gap: approximately `8px`.

The compact metrics apply to rendered rows, not only the striped background.
Commands and localized output continue to wrap instead of widening the page.

## Replay controller

The command typing, output reveal, internal scroll, pause, resume, loop reset,
and reduced-motion behavior remain unchanged.

The visible `03 / 03` element is removed completely. `TerminalReplay` no longer
queries or requires a progress node and no longer updates progress text while a
stage runs. Stage values remain on `data-replay-stage` solely to group lines for
the existing animation sequence.

If initialization or playback fails, the controller continues to restore the
complete static transcript. If `IntersectionObserver` is unavailable or reduced
motion is active, the completed transcript remains readable without animation.

## Responsive behavior

The desktop terminal body retains enough height for the replay to demonstrate
internal scrolling. Removing the footer and reducing the title bar makes the
overall window materially shorter without clipping the viewport.

At mobile breakpoints:

- the terminal stays within the page gutter;
- traffic lights remain visible;
- the transcript keeps the same `1.18` line-height ratio;
- font size steps down without locale-specific shrinking;
- commands and output wrap inside the transcript;
- only the transcript scrolls vertically; and
- the document never gains horizontal overflow.

Verification covers Korean, English, Japanese, and Simplified Chinese at
1440px, 390px, and 320px. Runtime measurements must confirm the terminal bounds
stay within the viewport and the rendered line-height ratio is no greater than
`1.2`.

## Accessibility

- The localized `role="img"` summary remains available to assistive technology.
- Decorative traffic lights remain `aria-hidden="true"`.
- The transcript remains decorative and does not become a live region.
- Removing the progress counter does not remove meaningful status because the
  replay's completed accessible summary already describes the full workflow.
- The existing reduced-motion behavior remains the non-animated equivalent.

## Test strategy

Automated site tests must prove:

- all five requested Korean strings are absent from generated homepage HTML;
- localized workflow labels and footer statuses are absent in all four locales;
- no visible homepage release label, terminal version, session title, terminal
  footer, or progress markup is generated;
- the real three commands and localized transcript remain intact and ordered;
- the replay controller has no progress-node dependency;
- the terminal CSS uses the Ghostty surface, JetBrains Mono, compact title bar,
  and `1.18` line height;
- the outer double frame, ruled background, footer, glow, scan effect, and home
  hover lift are absent; and
- the existing localization, SEO, theme, documentation, and reduced-motion
  tests remain green.

Browser verification must prove:

- the animation types and reveals all three commands in order;
- internal scrolling and loop reset still work without a progress node;
- the complete static transcript appears under reduced motion;
- computed terminal colors, type size, line height, and chrome match this
  specification;
- none of the removed strings is visible;
- the terminal and page have no horizontal overflow at 1440px, 390px, and
  320px; and
- the dark terminal remains visually coherent in both website themes.

Production verification repeats the desktop and mobile runtime checks after the
Pages deployment succeeds.

## Realtime checkpoint strategy

1. Commit and push this approved design as
   `docs(site): define Ghostty-style workflow terminal`.
2. Implement markup, controller, font, styling, and coupled regression tests as
   one green feature checkpoint:
   `feat(site): adopt Ghostty-style workflow terminal`.
3. Create a separate corrective checkpoint only if browser or production
   verification exposes a real defect.

Every checkpoint uses explicit staging, relevant tests, `git diff --check`, an
ordinary push, and upstream parity verification.

## Non-goals

- No change to the Swift CLI, command syntax, command output, MCP server, or
  KakaoTalk automation.
- No interactive terminal input or command execution on the website.
- No change to replay content, chat examples, locale routing, documentation
  page content, release metadata, tags, or deployment workflow.
- No Ghostty or iTerm2 trademark, icon, source code, theme file, or other
  external asset is copied into the site.
- No framework migration or animation dependency is introduced.
