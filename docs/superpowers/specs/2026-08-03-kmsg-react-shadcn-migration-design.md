# KMSG React and Shadcn migration

Status: Approved by the user on 2026-08-03.

## Context

The KMSG website is currently a Node-generated static site. It emits Korean at
the root and English, Japanese, and Chinese under locale prefixes. It also
ships documentation, legal pages, SEO metadata, discovery files, legacy route
redirects, a dark and paper theme, and a JavaScript terminal replay.

The current implementation recently adopted selected Shadcn conventions such
as semantic color variables and `data-slot` attributes, but it is not a React
or Tailwind application. The language control is still a native `<select>`, and
several surfaces only imitate Shadcn composition through generated markup.

The user explicitly selected a full React, Tailwind, and Shadcn migration rather
than a static imitation. They also authorized best-judgment execution without
repeated approval pauses. This design therefore replaces the site architecture
while preserving the product, localization, accessibility, and publication
contracts users already depend on.

This specification supersedes the earlier balanced-landing specification only
where that document listed framework migration as a non-goal. Its product copy,
visual identity, terminal, responsive, localization, and evidence contracts
remain requirements.

The user also selected `https://chann.github.io/skills/` as the reference for a
large staggered text reveal whose lower letterforms appear intentionally
cropped. Direct inspection showed an oversized footer wordmark revealed one
character at a time through a short overflow-hidden line box. KMSG adopts that
motion language for its own footer without copying the reference site's brand,
copy, color, or layout.

## Goal

Replace the current static UI implementation with a React Router application
that uses actual Shadcn component source and Tailwind styling while continuing
to publish complete static HTML to GitHub Pages.

The primary visible outcome is a Shadcn `DropdownMenu` language selector on
every route. The broader outcome is a coherent Shadcn component system across
navigation, actions, cards, badges, disclosures, separators, and feedback.

## Success criteria

- The language selector is an actual Shadcn/Radix `DropdownMenu` composed with
  `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuGroup`, and
  `DropdownMenuRadioGroup`/`DropdownMenuRadioItem`.
- Selecting Korean, English, Japanese, or Chinese preserves the current page,
  stores `kmsg-locale`, and navigates to the matching localized static route.
- Arrow keys, Home, End, Enter, Space, Escape, outside click, focus return, and
  menu-item focus behavior come from the Radix primitive rather than custom
  hand-written menu emulation.
- Shared actions use Shadcn `Button` or `buttonVariants`; product surfaces use
  full `Card` composition; compact facts use `Badge`; dividers use `Separator`;
  FAQ uses `Accordion`; mobile navigation uses `Sheet`.
- All canonical KO, EN, JP, and CN pages are pre-rendered to complete HTML.
- Existing canonical, hreflang, Open Graph, FAQ schema, sitemap, robots, LLM,
  web manifest, legacy redirects, and 404 behavior remain available.
- Existing KMSG content, command strings, product claims, videos, images,
  terminal transcript, and legal text remain source-accurate.
- The footer contains a large decorative `kmsg` wordmark that rises in with a
  staggered reveal and retains the reference's intentional shallow lower crop.
- Dark and paper themes retain the KMSG black, off-white, and Kakao yellow
  identity rather than becoming a generic default Shadcn theme.
- Desktop, tablet, 390px, 375px, 320px, keyboard-only, reduced-motion, and both
  themes are verified across all four locales.
- The site builds on Node.js 22, passes automated tests, deploys through the
  existing Pages workflow, and finishes with local/upstream parity `0 0`.

## Non-goals

- No change to the Swift CLI, native MCP server, KakaoTalk automation, command
  syntax, packaging, release version, or Homebrew formula.
- No server runtime, database, authentication, analytics, form, account,
  cookie banner, or client-side CMS.
- No replacement of factual content with generic Shadcn demo copy.
- No invented testimonial, metric, partner, quote, or unsupported product
  claim.
- No change to the public URL, repository Pages base path, or locale codes.
- No continuously running scroll listener or decorative animation dependency.
- No release tag or version bump as part of the website migration.

## Architecture decision

### Selected stack

- React Router Framework Mode for route modules and build-time prerendering.
- React 19 and TypeScript for component and content contracts.
- Vite through the React Router toolchain.
- Tailwind CSS v4 with semantic CSS variables in the global stylesheet.
- Shadcn `nova` style, Radix base, and Lucide icons.
- Official Shadcn component source committed under `site/app/components/ui/`.
- `marked` and `sanitize-html` retained for source-document rendering.
- Vitest and Testing Library for unit/component tests.
- Playwright for route, interaction, responsive, and accessibility smoke tests.
- Node scripts for post-build static resources and artifact validation.

Radix is selected explicitly because the requested control is a dropdown menu,
and its focus management, keyboard navigation, portal behavior, and checked
radio items provide the required interaction contract without custom widget
logic. The `nova` style supplies a restrained starting density; KMSG semantic
tokens replace its stock colors.

### Static rendering model

React Router runs with runtime SSR disabled and an explicit prerender list. The
list contains the eight canonical page keys for each locale:

- home;
- usage;
- architecture;
- mcp;
- skill;
- versioning;
- privacy; and
- terms.

This produces 32 canonical localized documents. Korean remains at `/`; English,
Japanese, and Chinese remain at `/en/`, `/jp/`, and `/cn/`. Route links use the
same trailing-slash public form as the current website.

The production asset base remains `/kmsg/` for GitHub Pages. The final publish
directory remains `site/dist` so the existing Pages artifact boundary stays
stable. A post-build script normalizes React Router's client output into that
directory and adds non-route static resources.

### Alternatives rejected

Next.js static export would also pre-render the site but adds framework and
hosting conventions that KMSG does not otherwise need. A plain Vite SPA would
be smaller but would weaken the existing complete-HTML, metadata, and static
route contract. A hybrid site that keeps the old generator around React islands
would not satisfy the requested full migration.

## Source layout and boundaries

The final site is organized by responsibility:

```text
site/
├── app/
│   ├── components/
│   │   ├── ui/                  # Shadcn CLI-owned component source
│   │   ├── site-header.tsx      # desktop header and mobile Sheet
│   │   ├── language-menu.tsx    # locale DropdownMenu only
│   │   ├── theme-toggle.tsx     # persisted theme Button
│   │   ├── copy-button.tsx      # clipboard fallback and feedback
│   │   ├── terminal-replay.tsx  # cancellable localized workflow replay
│   │   ├── footer-wordmark.tsx  # staggered clipped kmsg text reveal
│   │   ├── markdown-article.tsx # sanitized documentation surface
│   │   └── site-footer.tsx
│   ├── content/
│   │   ├── locales.ts           # locale metadata and UI labels
│   │   ├── routes.ts            # page keys and localized path mapping
│   │   ├── home.ts              # localized product-page content
│   │   ├── legal.ts             # localized privacy and terms copy
│   │   └── faq.ts               # localized FAQ data and schema source
│   ├── lib/
│   │   ├── locale.ts            # pure same-page locale mapping
│   │   ├── metadata.ts          # canonical, alternates, OG, JSON-LD
│   │   ├── markdown.server.ts    # build-time read/parse/sanitize boundary
│   │   └── theme.ts             # theme constants and inline bootstrap
│   ├── routes/
│   │   ├── home.tsx
│   │   ├── document.tsx
│   │   └── legal.tsx
│   ├── app.css                  # Tailwind v4 and KMSG semantic tokens
│   ├── root.tsx                 # document shell and shared providers
│   └── routes.ts                # explicit route definitions
├── public/                       # copied static media and font assets
├── scripts/
│   ├── build-static.mjs         # post-build redirects/discovery files
│   └── verify-dist.mjs          # artifact contract checker
├── test/
│   ├── locale.test.ts
│   ├── language-menu.test.tsx
│   ├── components.test.tsx
│   ├── metadata.test.ts
│   └── build.test.mjs
├── e2e/
│   └── site.spec.ts
├── components.json
├── react-router.config.ts
├── vite.config.ts
└── package.json
```

The current `site/build.mjs`, `site/src/app.js`, and `site/src/styles.css` stay
available during parity work but are removed after the React build proves every
required artifact and behavior. Git history remains the rollback source; no
duplicate legacy runtime ships in the final site.

## Route and content model

`LocaleId` is exactly `"ko" | "en" | "jp" | "cn"`. `PageKey` is exactly the
eight canonical page keys above. A single route table maps `LocaleId` and
`PageKey` to the public path. Rendering, navigation, canonical metadata,
hreflang metadata, sitemap generation, tests, and the language dropdown all
consume this table so route knowledge cannot drift across implementations.

Product and legal copy move from the monolithic generator into typed records.
Fixed CLI command names and protocol labels stay in English. Localized chat
names, messages, headings, descriptions, UI labels, dates, and legal copy stay
localized exactly as they are now.

Documentation remains sourced from the existing Markdown files. Build-time
route loaders read the authoritative source, render with `marked`, sanitize
with the existing allowlist, and return serializable HTML plus heading data.
No source Markdown is duplicated into JSX.

## Language dropdown

### Composition

`LanguageMenu` uses this actual Shadcn composition:

```text
DropdownMenu
├── DropdownMenuTrigger → Button variant="outline" size="sm"
└── DropdownMenuContent align="end"
    └── DropdownMenuGroup
        ├── DropdownMenuLabel
        └── DropdownMenuRadioGroup
            ├── DropdownMenuRadioItem value="ko"
            ├── DropdownMenuRadioItem value="en"
            ├── DropdownMenuRadioItem value="jp"
            └── DropdownMenuRadioItem value="cn"
```

The trigger shows a globe icon, the current short locale label, and a chevron.
Its accessible name is the localized language-selection label plus the current
language. The checked item is visible through the primitive's radio indicator
and `aria-checked` state. Items are always nested inside a group.

### Behavior

The component receives `locale`, `pageKey`, and the four route targets. On value
change it stores `kmsg-locale`, closes the menu, and performs document navigation
to the matching route. Document navigation is deliberate: it guarantees the
new page's `<html lang>`, metadata, structured data, and static content all
match the selected locale without a transient mixed-language state.

The menu works in the desktop header and inside the mobile shell without being
clipped by the floating navigation. Radix owns the portal and stacking. No
manual z-index is added to the component. A compact `<noscript>` locale-link
group follows the trigger so language routes remain discoverable without
JavaScript.

The root locale bootstrap only redirects when a saved locale is valid and the
visitor is on the Korean root entry. It never redirects an explicit locale or
document URL away from the visitor's chosen route.

## Shared shell and components

### Header and mobile navigation

The desktop header retains the floating KMSG capsule. Navigation links remain
semantic anchors and use `buttonVariants` only when they need button styling.
The theme toggle is a Shadcn icon `Button` with a localized accessible name and
a `Tooltip` for pointer users.

At mobile widths, secondary navigation and theme control move into a Shadcn
`Sheet`. `SheetTitle` is always present for accessibility. Radix supplies focus
containment, Escape close, outside-interaction close, scroll locking, and focus
restoration. The language menu remains in the compact closed header.

### Buttons and feedback

Hero, documentation, copy, menu, theme, install, and story actions use `Button`
variants or `buttonVariants`. Icons use `data-icon="inline-start"` or
`data-icon="inline-end"` and inherit component sizing.

`CopyButton` exposes idle, copied, and failed labels through an `aria-live`
region. It uses `navigator.clipboard.writeText` first and retains the existing
textarea/`execCommand` fallback. The copied state returns to idle after 1.6
seconds and cancels the prior timer on repeat activation or unmount.

### Cards, badges, separators, and accordion

Principles, coding-agent setup, stories, and the final install surface use full
`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and where
appropriate `CardFooter` composition. Layout differences come from wrapper
layout classes, not component color overrides.

Hero proof items, feature points, agent names, and requirement chips use
`Badge` variants. Capability boundaries use `Separator`. The FAQ uses Shadcn
`Accordion`, with every trigger inside an item and each localized answer in
`AccordionContent`. Only one answer is open at a time and items are collapsible.

The terminal remains a purpose-built product visualization rather than being
forced into a generic card. Its surrounding explanation may use Shadcn layout
surfaces, but the Ghostty terminal contract remains intact.

### Animated footer wordmark

The normal footer keeps a visible, accessible `kmsg` home link, factual product
tagline, MIT License link, and GitHub link. Beneath it, `FooterWordmark` renders
an `aria-hidden="true"` decorative `kmsg` word in the current theme's Kakao
yellow accent.

The reference motion is implemented as a **Reveal** combined with a **Stagger**:

- the wordmark container is `0.72em` high with `overflow: hidden`;
- letters use `line-height: 0.84` so the lower edge remains intentionally and
  consistently cropped rather than merely disappearing during entrance;
- each letter begins at `translateY(0.42em)` and `opacity: 0`;
- the visible state is `translateY(0)` and `opacity: 1`;
- each following letter starts 55ms after the previous letter;
- the transition lasts 800ms with `cubic-bezier(0.16, 1, 0.3, 1)`;
- the reveal starts once when roughly 20 percent of the wordmark enters the
  viewport; and
- reduced motion renders every letter immediately in its final cropped state.

The component uses one `IntersectionObserver`, disconnects after the first
reveal, and stores character index in a CSS custom property. Only `transform`
and `opacity` animate, so the effect stays on the compositor and does not cause
layout shift. The final crop is produced by typography and the line box, not by
per-frame height animation, a soft gradient mask, or a continuously running
scroll listener.

At desktop widths the wordmark uses `clamp(5rem, 12vw, 11rem)`. Mobile uses a
responsive viewport step that keeps the entire four-letter word inside 320px
without horizontal overflow. The crop is checked separately in Latin glyphs
because it is decorative; localized meaningful text is never clipped.

## Theme and visual system

Tailwind v4 maps the current KMSG tokens into Shadcn semantic names:

- `--background` / `--foreground`;
- `--card` / `--card-foreground`;
- `--popover` / `--popover-foreground`;
- `--primary` / `--primary-foreground`;
- `--secondary` / `--secondary-foreground`;
- `--muted` / `--muted-foreground`;
- `--accent` / `--accent-foreground`;
- `--border`, `--input`, and `--ring`.

Dark primary remains `#fee500`; paper primary remains `#f2d500`. The current
dark canvas, paper canvas, text hierarchy, terminal palette, and semantic
status colors remain. The root uses `.dark` for Shadcn compatibility and an
additional `data-theme="paper"` marker only where existing non-Tailwind code
or metadata needs the explicit product theme name.

An inline bootstrap script in the prerendered document reads `kmsg-theme`
before React hydration and sets the root class and theme-color metadata. This
prevents a dark/paper flash and avoids hydration mismatches. The React theme
control uses the same constants and storage key.

The current Geist asset remains self-hosted. Locale-appropriate system fallbacks
continue to render Korean, Japanese, and Chinese. No runtime font request is
added.

## Client interaction boundaries

Most routes and content are prerendered and need no client state. Client logic
is isolated to:

- `LanguageMenu` for persisted route selection;
- `ThemeToggle` for persisted theme changes;
- `MobileNavigation` for the Sheet;
- `CopyButton` for clipboard feedback;
- `TerminalReplay` for the existing cancellable animation;
- `FooterWordmark` for one observer-driven staggered reveal;
- the tagline reveal observer; and
- documentation table-of-contents highlighting.

No component reads `window`, `document`, storage, media queries, or observers
during server/prerender render. Browser-only state initializes in effects or
through stable props. Every animation path has a complete reduced-motion state.

## Terminal replay preservation

The terminal continues to show the real `kmsg chats → kmsg read → kmsg send`
sequence with localized chat names, senders, messages, replies, and times. It
keeps Unicode-safe character iteration, viewport/document visibility pausing,
cancellation, internal scrolling, loop reset, and static fallback content.

The component owns its timer and `AbortController`, cleans both up on unmount,
and never writes operational data to stdout or an external service. Reduced
motion renders the complete transcript and final workflow state immediately.

## Metadata, discovery, and compatibility files

Each route module produces localized title and description data. The root
document emits canonical and four hreflang links, Open Graph locale alternates,
theme color, manifest, favicon, and JSON-LD. Home routes include SoftwareApplication
and FAQ schema built from the same typed FAQ data rendered on screen.

The post-build script generates:

- `robots.txt`;
- `sitemap.xml` containing every canonical localized route;
- `llm.txt`, `llms.txt`, and `llms-full.txt`;
- `site.webmanifest`;
- `.nojekyll`;
- branded `404.html` recovery; and
- legacy `/ko/*` and `/openclaw/*` redirect documents.

Redirect targets are derived from the central route table. Static media and
font assets are copied from `public/` by the normal build rather than through a
parallel hand-maintained asset list.

## Error and recovery behavior

- Invalid locale or page keys fail the production build rather than emitting a
  partially localized page.
- Missing Markdown source, missing localized product content, duplicate route,
  or missing metadata fails the route/artifact verifier.
- Clipboard failure produces localized visible and accessible feedback without
  changing the command text.
- Storage failures do not block theme or locale behavior for the current view.
- A failed terminal animation restores the complete static transcript.
- The Pages 404 document offers localized home routes and does not enter a
  redirect loop.
- JavaScript-disabled pages retain prerendered content, semantic navigation,
  direct locale links, documentation, and command text.

## Accessibility and responsive behavior

Every interactive control has a localized accessible name, visible focus, a
minimum 44px touch target at mobile widths, and a semantic role supplied by its
native or Radix primitive. Dialog-like Sheet content includes a title. Menu and
accordion items use their required parent groups.

The animated footer wordmark is excluded from the accessibility tree because
the same brand name already exists as a normal footer home link. Its clipped
lower edge is therefore a decorative graphic treatment, not lost information.
Reduced-motion users receive the final wordmark with no translate or opacity
transition.

Wide Markdown tables remain keyboard-focusable labelled regions with horizontal
scrolling. Code blocks retain accessible copy controls. CJK prose preserves
locale-aware wrapping and never forces code tokens through `word-break: keep-all`.

The site must have no page-level horizontal overflow at 1440, 1024, 768, 390,
375, or 320 CSS pixels. Dropdown content stays in the viewport in all four
locales. Header, Sheet, cards, badges, command surfaces, terminal, FAQ, and
footer are tested in dark and paper themes. Axe incomplete results are reported
separately from violations.

## Testing strategy

### Unit and component tests

- Route-table tests cover every `(locale, pageKey)` pair and same-page locale
  mapping.
- `LanguageMenu` tests cover trigger label, checked state, keyboard opening,
  radio selection, storage success/failure, and navigation intent.
- Theme tests cover bootstrap parity, storage failure, root classes, metadata,
  and accessible labels.
- Copy tests cover Clipboard API success, fallback success, failure feedback,
  repeat activation, and timer cleanup.
- Shadcn composition tests assert required group/title/content relationships.
- Metadata tests cover canonical, hreflang, OG alternates, and JSON-LD parity.
- Footer wordmark tests cover one character span per Unicode code point,
  sequential 55ms delays, observer cleanup, final visibility, `aria-hidden`,
  and reduced-motion behavior.

### Build and artifact tests

The production build is followed by `verify-dist.mjs`, which proves:

- all 32 canonical localized HTML files exist;
- every file contains localized HTML, title, description, canonical, and
  alternate links;
- required redirect and discovery files exist and point to canonical routes;
- assets are rooted under `/kmsg/` and no development origin leaks;
- every homepage contains the language dropdown, terminal commands, factual
  stories, six FAQ items, and install command; and
- no legacy native language `<select>` remains.

### Browser verification

Playwright covers:

- language menu behavior on home and documentation routes for KO/EN/JP/CN;
- persistence after reload and same-document route preservation;
- keyboard-only menu, Sheet, accordion, copy, theme, and navigation flows;
- dark and paper themes;
- terminal play, pause, reset, and reduced-motion completion;
- footer wordmark entrance, final lower crop, and reduced-motion rendering;
- 1440px and 390px visual screenshots plus 375px and 320px overflow checks;
- no console errors, failed local assets, or hydration warnings; and
- Axe results on home and documentation surfaces.

Existing Node artifact assertions are migrated or replaced only after the new
tests prove the same user-facing contract. A passing component test cannot
substitute for production artifact or browser evidence.

## Realtime checkpoint strategy

The migration is published in independently green checkpoints:

1. approved design and implementation plan;
2. React Router, Tailwind, Shadcn foundation with static build parity;
3. shared shell, actual language dropdown, theme, and mobile Sheet;
4. product-home sections using Shadcn components and preserved interactions;
5. documentation, legal, metadata, redirects, and discovery parity;
6. browser, accessibility, CI, and production corrections; and
7. removal of the legacy generator after full parity is proven.

Each checkpoint runs its relevant tests plus `git diff --check`, stages explicit
paths, uses a Conventional Commit, pushes the explicit main branch ref, and
requires upstream parity `0 0` before the next checkpoint begins.

The unrelated untracked `tasks/` directory remains untouched and unstaged.

## Completion evidence

Completion requires all of the following current-state evidence:

- `components.json` identifies a React Router/Tailwind v4/Radix project.
- Shadcn component source exists and the language menu imports it directly.
- No native language `<select>` or static Shadcn imitation remains.
- The decorative footer `kmsg` reveal is visible, staggered, intentionally
  lower-cropped, motion-reduced, and free of page-level overflow.
- Unit, component, build, artifact, and browser suites pass.
- Production Pages completes successfully for the final commit.
- Live routes return 200, language/theme/menu interactions work, assets load,
  and no horizontal overflow or console error appears at required viewports.
- Git worktree contains only the pre-existing `tasks/` directory.
- `HEAD`, upstream, and remote main are identical with `0 0` parity.
