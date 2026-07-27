# Editorial terminal homepage polish

Status: Autonomously approved on 2026-07-28. The user explicitly delegated
design decisions and requested completion without an approval wait.

## Context

The homepage already has the right product facts, four localized routes, a
real `chats → read → send` replay, coding-agent installation, user stories,
and a working final CTA. Its visual language is consistent, but the 5,771px
desktop page repeats centered headings, evenly sized cards, and generous empty
space. The result is orderly but feels like a template instead of a page built
around a local macOS command-line tool.

This pass keeps the content architecture and product truth intact. It improves
composition, density, typography, and interaction without adding decorative
marketing copy, framework dependencies, or ornamental backgrounds.

## Design alternatives

1. **Maintenance polish:** Keep the centered composition and change only
   spacing, borders, and shadows. Lowest risk, but not enough visual progress.
2. **Editorial terminal:** Use an asymmetric 12-column hero, left-aligned
   section architecture, technical notes instead of decorative cards, and
   different rhythms for capabilities, agent setup, stories, and installation.
3. **High-chroma Kakao:** Expand yellow surfaces and motion throughout the
   page. Memorable, but too promotional for the restrained product voice.

The chosen direction is **editorial terminal**.

## Subject, audience, and job

- **Subject:** KMSG, a local macOS KakaoTalk CLI and native MCP server.
- **Audience:** Developers and agent builders evaluating whether KMSG is
  concrete, safe, and quick to install.
- **Single job:** Prove the real workflow, then make installation the obvious
  next action.

## Visual system

### Color

The current palette is retained because it is specific to the product:

- `Kakao signal` — `#FEE500`
- `Canvas` — `#080808`
- `Raised canvas` — `#111110`
- `Primary ink` — `#F4F4F2`
- `Muted ink` — `#A4A4A0`
- `Terminal graphite` — `#282C34`

Yellow remains a signal, never a background wash. Paper theme continues to use
the existing light tokens.

### Typography

- Display: IBM Plex Sans / IBM Plex Sans KR
- Body: IBM Plex Sans / locale-specific Noto fallbacks
- Utility and labels: IBM Plex Mono
- Terminal: JetBrains Mono

The page uses larger left-aligned display type and tighter line lengths instead
of introducing another font download. Headings use balanced wrapping; numbers
and command tokens use the utility faces.

### Layout

Desktop hero:

```text
┌──────────────────────────────────────────────────────────────────┐
│ [logo]  macOS KakaoTalk CLI · MCP server                         │
│         KakaoTalk을                                               │
│         AI Native 하게 사용하세요.                                │
│         description                         [install]  usage →   │
└──────────────────────────────────────────────────────────────────┘
          ┌──────────── real terminal replay ────────────┐
          └───────────────────────────────────────────────┘
```

Content section:

```text
┌───────────────┬──────────────────────────────────────────────────┐
│ section label │ large heading                                    │
│               │ optional factual description                     │
├───────────────┴──────────────────────────────────────────────────┤
│ section-specific content, not one repeated card template         │
└──────────────────────────────────────────────────────────────────┘
```

Mobile returns to one column, keeps 16px page gutters, and preserves source
order. No section or code surface may create page-level horizontal overflow.

## Signature element

The memorable element is one uninterrupted workflow:

1. the KMSG logo acts like a prompt token;
2. the imperative headline reads like the command;
3. the real terminal provides the output.

No additional ambient blobs, grids, badges, or metadata are added. The terminal
replay remains the only substantial motion.

## Component decisions

### Header

Keep the compact capsule and current controls. Improve focus, touch handling,
and alignment only; do not add navigation items or a mobile menu.

### Hero and terminal

- Switch the hero to a 12-column grid on desktop.
- Place the product mark in a narrow left rail and the content in the remaining
  columns.
- Align the lead and actions on one shared row where space allows.
- Match terminal width to the primary content grid and reduce excess vertical
  separation.
- Preserve the exact localized headline, CTA, usage link, replay commands, and
  reduced-motion behavior.

### Principles

The three principles are facts, not actions. Remove the decorative card
treatment and present them as technical notes with restrained structural
separators. Keep AX, MCP, and structured-output tokens because they identify
real product concepts.

### Capabilities

Keep the ordered read/watch/send sequence and alternating composition. Tighten
row height, strengthen the command specimens, and use separators only between
rows.

### Coding-agent skill

Keep the two-step sequence. Use unequal columns and stronger command hierarchy
so the installation command is the visual anchor while invocation examples
remain easy to scan.

### Stories

Use a 7/5 asymmetric grid with the second story offset on desktop. Preserve
real YouTube thumbnails, links, publishers, lazy loading, and mobile stacking.

### Installation

Keep one final installation panel, but reduce its height and align its content
more directly. The command remains copyable and the requirements remain
visible.

## Motion and interaction

- Keep the existing terminal replay and hero entrance.
- Animate only `transform` and `opacity`.
- Preserve interruption through visibility and intersection observers.
- Honor `prefers-reduced-motion`.
- Keep visible `:focus-visible` states, semantic links/buttons, 44px minimum
  primary targets, and browser zoom.

## Accessibility and web-interface contract

- One `h1`; hierarchical section headings.
- Icon-only controls retain localized `aria-label` values.
- Decorative imagery retains `alt=""`; story images keep descriptive alt text.
- Brand and command tokens use `translate="no"` where practical.
- Headings use balanced wrapping and long code values continue to wrap or
  scroll inside their own component.
- Native theme and locale controls remain keyboard accessible.

## Non-goals

- No framework migration, new runtime dependency, analytics, account flow, or
  CLI behavior change.
- No new claims, testimonials, invented metrics, or stock imagery.
- No rewrite of documentation routes.
- No new animation system or scroll-jacking.
- No version bump or release tag.

## Acceptance criteria

- The desktop hero is demonstrably asymmetric while mobile remains one column.
- Section headings use an editorial label/content grid on desktop.
- Principles no longer render as generic bordered cards.
- Capabilities, agent setup, stories, and install each have distinct rhythms.
- Desktop page height is materially reduced from the 5,771px baseline without
  hiding content.
- At 320px, 390px, 768px, and 1440px, `scrollWidth === innerWidth`.
- Dark and paper themes remain readable.
- Four localized home routes preserve their content and structure.
- Terminal replay, locale selection, theme switching, and copy controls work.
- `npm test --prefix site`, GitHub Pages, and Swift CI pass.
