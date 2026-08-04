# KMSG scroll-scrub product tagline

Status: Approved by the user on 2026-08-04.

## Context

The Korean homepage product tagline is authored as three exact lines:

```text
모든 대화를 명령 한 줄로.
kmsg는 별도 서버 없이
macOS 에서 직접 실행됩니다.
```

It currently uses the shared replayable intersection hook to raise and fade
those lines when the paragraph enters the viewport. The user wants this text
moment to follow the more deliberate reading interaction used by the
`Repeatable by design` statement on `https://chann.github.io/skills/`.

The reference keeps authored lines, splits each line into words, and maps the
heading's scroll progress to each word's opacity. Its progress starts when the
heading top reaches 85% of the viewport and completes when the heading bottom
reaches 50%. Scrolling upward reverses the same progression. Reduced-motion
users receive fully visible text without scroll-driven styles.

## Goal

Replace only the product tagline's line-entry transition with a reversible,
word-by-word scroll scrub while preserving KMSG's exact copy, three authored
Korean lines, restrained visual system, static output, responsive layout, and
accessibility fallbacks.

## Success criteria

- The Korean tagline remains exactly the three authored lines above.
- Each line remains a block-level authored line; viewport width does not infer
  or reorder line boundaries.
- Words brighten in reading order as the user scrolls down and dim in the
  reverse order as the user scrolls up.
- Scroll progress starts when the tagline top reaches `85vh` and finishes when
  the tagline bottom reaches `50vh`, matching the reference behavior.
- Each word maps its own equal progress interval from opacity `0.22` to `1`.
- The animation is directly coupled to scroll position, with no one-shot
  duration, easing, or delayed playback.
- Reduced-motion users and browsers missing required animation APIs see every
  word fully visible.
- The tagline remains exactly three visual lines at 320px, 390px, and desktop
  widths, with no horizontal overflow.
- The existing footer wordmark reveal, theme behavior, localized copy, and all
  other homepage motion remain unchanged.

## Chosen approach

Use a small native React hook driven by passive `scroll` and `resize` events,
coalesced through `requestAnimationFrame`. The hook measures the target
paragraph, converts its viewport position to a clamped progress value from `0`
to `1`, and exposes that value to the tagline component.

The component assigns each word an equal slice of the overall range. A pure
interpolation helper converts the current progress and the word's slice to an
opacity from `0.22` to `1`. This reproduces the reference interaction without
adding Framer Motion or another runtime dependency.

CSS scroll timelines were rejected because KMSG's supported macOS browser
surface needs a deterministic JavaScript fallback and unit-testable geometry.
Layering the existing line-rise animation under the scrub was rejected because
two motion systems would compete for the same reading moment. A one-shot word
stagger was rejected because it would not reverse with scroll and therefore
would not match the selected reference behavior.

## Component and data design

### Scroll progress utilities

The scroll module contains independently testable helpers:

- `clampScrollProgress(value)` constrains values to `0...1`;
- `calculateElementScrollProgress(rect, viewportHeight)` implements the
  `start 0.85` to `end 0.5` geometry; and
- `calculateWordOpacity(progress, index, count)` maps one word's equal interval
  from `0.22...1`.

For a target rectangle, progress is `0` while its top is at or below 85% of the
viewport. Progress is `1` once its bottom reaches or passes 50% of the
viewport. Intermediate positions interpolate linearly. Degenerate geometry or
non-finite input fails open to fully visible text.

### Scroll progress hook

`useScrollScrubProgress` returns a typed element ref and the current progress.
It:

- begins at progress `1` so server-rendered and no-JavaScript text is readable;
- performs an initial measurement after mount;
- schedules at most one animation frame for any group of scroll or resize
  events;
- registers the scroll listener as passive;
- cancels a pending frame and removes listeners during cleanup;
- skips listeners and stays at progress `1` for reduced motion; and
- stays at progress `1` if `requestAnimationFrame` is unavailable.

The hook does not use `IntersectionObserver`, timers, a continuous animation
loop, or layout-changing styles.

### Animated tagline

`AnimatedTagline` continues to accept one localized newline-delimited string.
It splits only on newline characters to create line spans, then splits each
line on spaces to create word spans. Spaces remain ordinary text between word
spans so copied and assistive text is unchanged.

Line spans use `display: block`. Word spans use `display: inline-block` and an
inline opacity calculated from the shared progress. The paragraph exposes a
rounded `data-scroll-progress` value for deterministic browser verification;
this attribute has no styling responsibility.

The current responsive type scale and section spacing stay unchanged. The old
`data-state`, translate transform, transition duration, and line delay are
removed from this component because progress now comes directly from scroll.
The shared replayable intersection hook remains unchanged for the footer
wordmark.

## Accessibility and failure behavior

- The tagline remains one semantic paragraph containing ordinary readable
  text; word wrappers do not receive roles or accessible labels.
- `prefers-reduced-motion: reduce` forces every word to opacity `1` in both the
  hook and CSS, with no scroll subscription.
- If measurement or animation-frame APIs are unavailable, text remains fully
  visible rather than becoming stuck in a dimmed state.
- Scroll and resize listeners are removed on unmount, and pending frames are
  cancelled to prevent updates after teardown.
- Opacity is the only animated property, so the interaction cannot alter line
  boxes, pointer targets, document height, or horizontal layout.
- Existing `word-break: keep-all` and responsive font sizing continue to
  protect the authored Korean lines.

## Verification

Automated tests will prove:

- scroll geometry at the start, midpoint, end, and clamped boundaries;
- monotonic word opacity and equal per-word progress ranges;
- down-scroll brightening and up-scroll dimming;
- exact Korean line and word order, including preserved spaces;
- reduced-motion and missing-animation-frame visible fallbacks;
- passive listener registration, frame coalescing, and cleanup; and
- removal of the old line transform, transition, and stagger contract.

The full `npm test --prefix site` gate must build all static routes, typecheck,
and pass both Vitest and Node tests. `git diff --check` is required before each
checkpoint.

Browser verification will sample the word opacities near 0%, 25%, 50%, 75%,
and 100% progress, then reverse scroll and confirm the values reverse. It will
also verify exact three-line geometry and zero horizontal overflow at 1440px,
390px, and 320px; dark and stored-paper themes; reduced-motion final visibility;
and an empty console/page-error report.

After publication, the same checks will be repeated against GitHub Pages.
GitHub CI and Pages must succeed for the final SHA, and local, tracking, and
live remote `main` must match with ahead/behind `0 0`.

## Realtime checkpoints

1. `docs(site): define scroll-scrub tagline` publishes this approved design.
2. `docs(site): plan scroll-scrub tagline` publishes the reviewed TDD and
   deployment procedure.
3. `feat(site): scrub tagline words with scroll` publishes the tested behavior,
   responsive styles, and regression coverage as one independently usable
   implementation outcome.

If final browser or deployment verification finds a regression, it becomes a
new corrective commit and ordinary push. Published commits are never amended
or force-pushed.

## Non-goals

- No change to the footer wordmark animation or its position.
- No change to Korean wording, other locales, theme persistence, navigation,
  terminal replay, cards, footer links, or legal content.
- No Framer Motion dependency, CSS scroll timeline, parallax, blur, scale,
  gradient, cursor effect, or decorative label/stat block from the reference.
- No change to Swift CLI, MCP, KakaoTalk automation, packaging, versioning,
  releases, or Homebrew behavior.
