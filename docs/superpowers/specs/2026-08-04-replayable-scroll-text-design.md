# KMSG replayable scroll text

Status: Approved by the user on 2026-08-04.

## Context

The KMSG React site currently has two prominent text moments near the lower
half of the homepage:

- a centered localized product tagline between separators; and
- an oversized, cropped `kmsg` footer wordmark.

The footer wordmark already follows the staggered letter reveal used by
`https://chann.github.io/cli-tools/`, but its observer disconnects after the
first entrance. Scrolling away and back therefore leaves the wordmark in its
final state. The centered tagline has authored line breaks but no viewport
reveal.

The user wants both text moments to respond to scrolling, wants the wordmark to
replay after leaving and re-entering the viewport, wants the wordmark lifted a
small additional amount inside its crop, and wants new visitors to see the dark
theme by default. The user selected the conservative theme contract: preserve
an explicit stored paper-theme choice while using dark when no choice exists.

## Goal

Make the lower-page typography feel like one deliberate scroll sequence while
preserving the restrained KMSG visual identity, authored localization, static
rendering, accessibility, and theme persistence.

## Success criteria

- The Korean tagline renders exactly as three authored lines:

  ```text
  모든 대화를 명령 한 줄로.
  kmsg는 별도 서버 없이
  macOS 에서 직접 실행됩니다.
  ```

- The tagline's lines rise and fade in with a short stagger when the tagline
  enters the viewport.
- The decorative `kmsg` letters rise and fade in with their existing stagger
  when the wordmark enters the viewport.
- Leaving either observed text region resets only that region to its hidden
  state; entering it again replays the animation.
- The wordmark's final position is approximately 6–8px higher at the largest
  desktop size while retaining its current shallow crop.
- With no stored theme preference, the document starts in dark mode before the
  first paint.
- A stored paper-theme choice remains paper across page loads and client
  navigation.
- Reduced-motion users see complete text immediately without transitions.
- The behavior works at desktop and narrow mobile widths without horizontal
  overflow or damaged authored line breaks.

## Chosen approach

Use repeatable `IntersectionObserver` state transitions. Each observed text
component remains observed for its mounted lifetime. An intersecting entry sets
its state to `revealed`; a non-intersecting entry returns it to `hidden`.
Existing CSS data-state selectors then own the visual transition.

This approach fits the current React and CSS architecture and uses compositor-
friendly `transform` and `opacity` only. Re-mounting DOM nodes to restart the
animation was rejected because it adds unstable component identity without a
user-facing benefit. Direct Web Animations API control was rejected because it
duplicates timing and reduced-motion state already expressed in CSS.

## Component design

### Repeatable intersection hook

A small shared hook owns the viewport state used by both text components. It:

- returns a typed element ref and `hidden` or `revealed` state;
- checks `prefers-reduced-motion: reduce` before creating an observer;
- returns `revealed` immediately when reduced motion is active;
- observes at the existing `0.2` threshold;
- updates state for both intersecting and non-intersecting entries;
- does not disconnect after the first reveal; and
- disconnects during component cleanup.

The hook does not attach a scroll listener, schedule a loop, or alter document
layout.

### Animated tagline

The homepage tagline becomes a focused component that receives the localized
newline-delimited string. It splits only on authored newline characters and
renders each line as its own block span. It does not infer wrapping from words
or viewport width.

Each line begins slightly below its final position with zero opacity. Revealed
lines transition upward and become opaque in reading order. The existing
centered type scale, separators, section width, and four-locale content model
remain unchanged. Korean changes from two lines to the exact three lines in the
success criteria; English, Japanese, and Chinese retain their current authored
copy and line boundaries.

### Footer wordmark

`FooterWordmark` keeps its four decorative letter spans, `aria-hidden="true"`,
current threshold, 55ms stagger, 800ms duration, and easing. It consumes the
repeatable intersection hook instead of owning a one-shot observer.

The final CSS lift changes from `-0.06em` to `-0.10em`. At the maximum 11rem
desktop size this raises the visible letters by about 7px. Container height,
font size, line height, overflow crop, weight, tracking, color, and responsive
scale remain unchanged.

## Theme contract

No theme behavior is replaced. The existing bootstrap remains authoritative:

- stored `paper` applies paper;
- absent, invalid, or inaccessible storage applies dark; and
- the inline bootstrap runs before the application scripts so the first paint
  matches the chosen theme.

Regression coverage will state the no-storage dark default explicitly in
addition to the existing stored-paper coverage.

## Accessibility and failure behavior

- The centered tagline remains real readable text.
- The large footer wordmark remains decorative and hidden from assistive
  technology because the footer already contains an accessible `kmsg` home
  link.
- Reduced motion skips observers and renders both text moments in their final
  visible positions.
- If `IntersectionObserver` is unavailable, both components render their final
  visible states instead of leaving content hidden.
- Observer cleanup prevents updates after unmount.
- Authored line breaks stay semantic through separate block spans; CSS may
  still preserve words at narrow widths using the site's existing `keep-all`
  rules.

## Verification

Automated verification will cover:

- hidden → revealed → hidden → revealed observer transitions;
- reduced-motion and missing-observer fallbacks;
- exact Korean line content and order;
- stagger, transform, duration, easing, and increased wordmark lift;
- dark bootstrap with empty storage and paper restoration with stored paper;
- the full `npm test --prefix site` build, typecheck, and test gate; and
- `git diff --check` before each implementation checkpoint.

Browser verification will use the locally built site at desktop and 390px
mobile widths. It will clear theme storage, confirm dark on first load, scroll
through each animated region, scroll away, return, and confirm a second visible
state transition. It will also confirm the three Korean line boxes, the raised
wordmark geometry, reduced-motion final states, no horizontal overflow, and no
console or page errors.

After publication, the generated production route and deployed GitHub Pages
site must contain the exact Korean copy and default-dark document shell. CI,
Pages, local/upstream/live-remote commit equality, and ahead/behind `0 0` are
required completion evidence.

## Non-goals

- No change to Swift CLI, MCP, KakaoTalk automation, packaging, version, or
  Homebrew behavior.
- No replacement of the paper theme and no deletion of stored user theme
  preferences.
- No animation library, CSS scroll timeline, continuously running scroll
  listener, parallax, blur, scale, gradient, or new decorative surface.
- No copy changes outside the exact Korean tagline line break.
- No change to locale routes, header controls, terminal preview, footer links,
  or legal content.
