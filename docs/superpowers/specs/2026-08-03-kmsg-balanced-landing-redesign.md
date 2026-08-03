# KMSG balanced landing redesign

Status: Approved by the user on 2026-08-03.

## Context

KMSG already has a strong product landing page with a Kakao yellow identity,
four localized routes, dark and paper themes, a real
`kmsg chats → kmsg read → kmsg send` replay, product capabilities, real user
stories, FAQ content, and a Homebrew close. Recent work also added a hero proof
line, a word-by-word tagline reveal, themed hero text, a three-step setup path,
balanced heading wraps, and orphan control.

The next pass should improve the page as a system rather than add more content.
The current desktop header is attached to the viewport edge, the mobile header
wraps into a dense second row, typography and motion use several overlapping
scales, and the workflow replay is visually smaller than the product story it
proves.

Two live references define the intended balance:

- `https://chann.github.io/design/` contributes a floating product shell,
  clear semantic hierarchy, restrained surfaces, strong evidence near claims,
  and complete responsive states.
- `https://seed-design.io/` contributes asymmetric composition, large scene
  changes, deliberate use of imagery, and spatial storytelling.

KMSG adopts those principles without copying either site's brand, assets, or
content. The existing KMSG primary colors and terminal identity remain the
recognizable center of the page.

## Goal and conversion contract

The page serves one audience and one action:

- Audience: macOS developers and automation users who want to use KakaoTalk
  from terminal scripts or an MCP client.
- Offer: an open source macOS CLI and native MCP server for discovering,
  reading, watching, and safely sending KakaoTalk messages.
- Primary action: install KMSG through Homebrew.
- Conversion: the visitor reaches the installation section or copies
  `brew install channprj/tap/kmsg`.

The Usage link remains a secondary text action. It must not visually compete
with the installation action above the fold.

## Goals

- Make the header feel like a deliberate product control rather than a wrapped
  documentation bar.
- Increase hierarchy and consistency without changing the existing yellow
  primary colors.
- Give the real terminal replay more visual and narrative weight.
- Preserve direct, factual product copy and the existing localized content.
- Use asymmetric layouts without introducing decorative clutter.
- Complete mobile navigation, interaction, focus, reduced-motion, and legal
  states.
- Preserve static generation, documentation routes, SEO/AEO surfaces, and
  GitHub Pages deployment.
- Keep every checkpoint independently testable, reviewable, and deployable.

## Non-goals

- No change to the Swift CLI, MCP protocol, KakaoTalk automation, command
  syntax, or terminal transcript.
- No framework migration, SPA router, animation dependency, analytics, form,
  account, or cookie banner.
- No release tag, version bump, Homebrew update, or CLI packaging work.
- No new testimonial, invented metric, synthetic product claim, or stock
  photography.
- No background gradient, parallax scrolling library, or continuously running
  document scroll listener.
- No removal of the four locales, paper theme, documentation layout, user
  stories, FAQ, or install command.

## Chosen direction

The selected direction is **Comfort shell with SEED spatial storytelling**.

Comfort defines the navigation, typography, interaction states, and evidence
hierarchy. SEED informs the asymmetric hero, the larger workflow scene, and the
alternating density of page sections. KMSG keeps its own black, off-white,
Kakao yellow, product photography, and Ghostty-style terminal.

The page uses the classic hero-plus-sections landing pattern because the real
terminal workflow makes the product understandable without a long educational
story.

## Information architecture

The localized homepage sequence is:

1. floating glass navigation;
2. asymmetric hero with the existing product image;
3. hero proof line;
4. terminal workflow theater;
5. asymmetric product-benefit bento;
6. read, watch, and send capability rows;
7. word-by-word benefit tagline;
8. coding-agent skill installation;
9. real user stories;
10. six-question FAQ;
11. Homebrew installation close; and
12. compact footer with documentation and legal links.

No new marketing section is added. The work improves composition, motion, and
state completeness inside this sequence.

## Header and navigation

### Desktop

The shared site header becomes a floating capsule detached from the top edge.
It remains sticky and uses the same constrained width as the page content.

The closed desktop state contains:

- KMSG brand and home link;
- Usage, Architecture, MCP, Skill, and GitHub navigation;
- locale selector; and
- theme control.

The capsule uses a flat translucent theme surface, a complete border, a soft
single-direction shadow, and a full-pill radius. Scrolling may strengthen the
surface opacity but must not change geometry or cause layout shift.

### Mobile

The closed mobile capsule contains the brand, locale selector, and menu button.
Theme and secondary navigation move into the expanded menu so the header never
wraps into a second row.

The menu button uses two visible lines that rotate and translate into an X.
The lines never disappear. Opening the menu creates a viewport-filling glass
overlay with:

- localized navigation links;
- theme control;
- GitHub action;
- staggered masked link entry;
- `aria-expanded`, localized accessible names, and current-page indication;
- focus containment and focus restoration;
- Escape and explicit close support; and
- background scroll locking while open.

Navigation remains fully usable without pointer input. With JavaScript
unavailable, the existing links remain visible through a non-overlay fallback.

## Hero

The hero remains a twelve-column asymmetric composition: factual copy on the
left and the existing KMSG workspace image on the right. The image keeps its
reserved dimensions and meaningful localized alternative text.

The Korean headline remains exactly:

> 카카오톡을
>
> AI Native 하게 사용하세요.

Other locales keep their currently verified authored line breaks. `AI Native`
remains Kakao yellow. The surrounding heading keeps the allowed theme-specific
text gradient:

- dark: `#FFFFFF → #9B9B9B`;
- paper: `#000000 → #666666`.

The headline and supporting paragraph each cap at 680px. The first headline
line uses 72px desktop, 60px tablet, and 48px mobile. The emphasized second
Korean line uses 48px desktop, 48px tablet, and 36px mobile. Other locales use
one consistent step per breakpoint unless their authored emphasis calls for the
same two-level treatment. Display weight does not exceed 700. Heading copy uses
balanced wrapping and prose uses pretty wrapping.

The primary action remains `설치하기` and the secondary Usage action remains a
text link. The existing proof line stays immediately beneath the actions:

- MIT open source;
- local execution on the user's Mac; and
- confirmation with the exact CLI token `dry-run` before sending.

## Workflow theater

The current replay is preserved, including:

- the exact `chats → read → send` order;
- all localized commands and output;
- Unicode-safe character typing;
- internal transcript scrolling;
- viewport and document-visibility pausing;
- cancellation and loop reset;
- complete static fallback; and
- reduced-motion behavior.

The Ghostty contract remains an explicit product exception to the general page
surface palette:

- terminal background `#282c34`;
- 36px title bar;
- 10px native traffic lights;
- JetBrains Mono terminal typography;
- 1.18 line height; and
- 13px, 12px, and 11px responsive terminal sizes.

Desktop turns the section into a two-part theater. A compact three-step rail
describes chat discovery, context reading, and safe sending. The terminal is
the dominant sticky surface while the rail remains inside the same section.
The replay controller marks the matching rail step as active when each existing
stage plays. This state is presentational, not an additional status announced
to assistive technology.

The terminal never becomes interactive and never suggests that the website can
execute commands. On mobile, sticky positioning is removed, the terminal sits
in normal document flow, and the three steps remain readable without animation.

## Product benefits and capabilities

The existing benefit content remains:

1. local on macOS;
2. CLI and native MCP; and
3. structured output.

The large local-Mac benefit remains the yellow anchor. The other benefits use
neutral flat surfaces. The grid keeps asymmetric spans instead of three equal
cards.

Read, watch, and send remain horizontal capability rows on desktop and logical
single-column sequences on mobile. Each row preserves its real command, code
surface, factual detail, and accessible scroll region. Dividers and accent bars
must not use a single card-side border; emphasis uses complete borders, inset
decoration, or spacing.

## Tagline, agent skill, stories, FAQ, and install close

The tagline remains a separate large-type moment with the current localized
two-line benefit. Its existing `Intl.Segmenter` word segmentation and
IntersectionObserver-driven word reveal remain. Muted words begin at roughly
30 percent of the theme text color and transition in reading order.

The agent-skill section keeps the real install command and the Claude Code and
Codex invocation examples. The copy button retains visible copied and failure
feedback with localized accessible names.

The two real Hermes videos remain the only social-proof stories. Their titles,
publishers, links, thumbnails, and search terms remain factual. The composition
may become editorial and asymmetric, but it must not invent quotations or
metrics.

The FAQ keeps six localized question-and-answer pairs in plain generated HTML
and existing FAQ schema. The visual treatment may use inline disclosure, but
keyboard behavior, focus, and answer availability must remain native and
predictable.

The final yellow installation panel keeps the current setup steps, Homebrew
command, requirements, Usage link, releases link, and independence statement.
It repeats the same primary installation intent as the hero.

## Visual system

### Color

The existing primary definitions are immutable:

- dark `--accent: #fee500`;
- paper `--accent: #f2d500`.

Kakao yellow is the only accent. Semantic terminal success and traffic-light
colors remain functional exceptions.

Page backgrounds are flat. The dark page and raised surfaces use the approved
neutral range `#131209`, `#181818`, `#1F1F1F`, `#272727`, and `#313131`.
Paper-theme neutrals stay warm and maintain current contrast. No background,
card, or section gradient is permitted.

### Typography

Geist Variable is the interface type family, with locale-appropriate system
glyph fallback where Geist has no CJK glyph. Add the pinned
`@fontsource-variable/geist` package, copy its required variable WOFF2 asset
into generated site assets, and load it through a local `@font-face`. The page
must not fetch Google Fonts at runtime. Commands and data retain the existing
functional monospace treatment; the workflow terminal retains JetBrains Mono.

Text sizes resolve to the standard 12, 14, 16, 18, 20, 24, 30, 36, 48, 60,
and 72px scale. Main buttons use 16px semibold text and header controls use 14px
semibold text. Display weight does not exceed 700. No italic face is used.

### Spacing and geometry

Only `0, 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, and 96px` spacing values
are introduced in the rebuilt landing rules. Existing documentation behavior
outside the touched shell is not mechanically rewritten.

Radii use the existing 8, 12, 16, and full-pill values. Nested elements follow
the outer-radius-minus-gap rule when the result exceeds 2px. Cards have either
a complete border or no border.

### Motion

New interface transitions use 700ms and
`cubic-bezier(0.32, 0.72, 0, 1)`. Page-entry reveals use IntersectionObserver
and animate only transform, blur, and opacity. No unthrottled document scroll
listener is introduced.

The existing terminal typing cadence is functional replay timing and remains
unchanged. Reduced motion resolves the menu, section reveals, tagline, and
terminal to complete readable states without an intermediate animation.

## Legal and failure surfaces

The footer gains localized Privacy and Terms links.

Privacy pages state that the static website has no account, form, analytics,
or server-side message collection, while external GitHub and YouTube links are
governed by those services. Terms pages state the independent open source,
MIT-licensed, unofficial nature of the project and direct users to the license.
The pages do not promise behavior beyond the repository's documented contract.

The generated 404 becomes a branded, index-excluded page with a clear route
back to the localized homepage. It may redirect after presenting that recovery
path, but the useful page must remain visible and operable with scripts disabled.

No cookie consent is added because the site does not add cookies, analytics,
or advertising. No form states are added because the landing page contains no
form. Existing copy controls cover success and inline failure states relevant
to the page.

## Generated architecture and file boundaries

The static Node generator remains the source of truth.

- `site/build.mjs` owns localized navigation labels, workflow-step labels,
  legal copy, homepage markup, footer links, structured data, and 404 output.
- `site/src/styles.css` owns the responsive shell, visual tokens, layouts,
  complete control states, and reduced-motion fallbacks.
- `site/src/app.js` owns mobile-menu state, focus handling, synchronized
  workflow-step presentation, copy feedback, theme, locale, and replay logic.
- `site/package.json` and its lockfile pin the self-hosted Geist asset package.
- `site/test/build.test.mjs` protects generated routes, content, selectors,
  primary colors, terminal contract, legal links, and no-regression behavior.

Documentation content and Swift sources remain outside the implementation
boundary unless a failing verification proves a tightly coupled correction is
required.

## Accessibility and interaction states

- Keep the skip link and semantic `nav`, `main`, `section`, `article`, and
  footer landmarks.
- Keep exactly one `h1` and a logical heading outline per page.
- Keep visible focus rings on every interactive element.
- Provide hover, active, focus, open, copied, and copy-failure states where the
  interaction supports them.
- Make menu state available through `aria-expanded` and localized accessible
  names.
- Keep code regions focusable, labelled, and keyboard-scrollable.
- Keep image dimensions and meaningful localized alternative text.
- Maintain WCAG AA contrast in dark and paper themes.
- Distinguish automated accessibility violations from incomplete manual checks.
- Prevent page-level horizontal overflow at every acceptance width.

## SEO and AEO

The site remains indexed. The Korean homepage keeps:

- title: `kmsg - macOS용 카카오톡 CLI 및 MCP 서버`;
- description: “터미널과 AI 코딩 에이전트에서 KakaoTalk 채팅을 찾고 읽고
  안전하게 보내는 macOS용 오픈소스 CLI와 MCP 서버입니다.”

Equivalent localized metadata is required for English, Japanese, and Chinese.
Canonical URLs, hreflang, Open Graph, Twitter metadata, FAQ schema, sitemap,
robots, web manifest, `llm.txt`, `llms.txt`, and `llms-full.txt` remain valid.
Privacy and Terms routes appear in sitemap output. The 404 is `noindex` and is
excluded from the sitemap.

## Responsive acceptance

### Desktop, 1100px and wider

- Floating header, hero, and page sections align to one constrained grid.
- Hero uses an asymmetric copy-and-image composition.
- Workflow rail and sticky terminal remain legible without viewport clipping.
- Benefits, capabilities, stories, and install close preserve intentional
  asymmetry.

### Tablet, 760px to 1099px

- Header controls reduce before wrapping.
- Hero and workflow may stack when their minimum readable widths cannot hold.
- Terminal transcript remains at least 12px with internal vertical scrolling.

### Mobile, 320px to 759px

- Closed header remains one floating row.
- Menu opens as a full-screen overlay and restores focus on close.
- Hero lines break at authored thought boundaries.
- Image, terminal, cards, code panels, stories, FAQ, and install panel remain
  inside the viewport.
- Buttons and controls provide at least 44px touch targets.
- No page-level horizontal overflow exists at 320, 375, or 390px.

## Verification

Each implementation checkpoint runs:

- `npm test --prefix site`;
- `git diff --check`;
- a complete diff review for the current outcome; and
- explicit-path staging only.

Final local browser verification covers:

- generated Korean root plus `/en/`, `/jp/`, and `/cn/`;
- documentation, Privacy, Terms, and 404 routes;
- dark and paper themes;
- 1440×1000, 1024px, 768px, 390×844, 375px, and 320px layouts;
- mobile menu mouse, keyboard, Escape, focus containment, and focus restore;
- locale switching and theme persistence;
- hero actions and copy controls;
- terminal stage order, internal scrolling, loop reset, visibility pause, and
  reduced-motion completion;
- tagline word reveal;
- current-page navigation, real links, and absence of dead `#` actions;
- page and terminal bounds with no document overflow;
- console errors; and
- automated WCAG A/AA results with incomplete checks reported separately.

After push, GitHub Pages and Swift CI must complete for the published commit.
Production verification repeats the Korean and English desktop flows, Korean
mobile navigation and terminal checks, route availability, metadata, assets,
and accessibility smoke tests. Completion requires local, upstream, and live
remote parity for the final commit.

## Realtime checkpoint plan

1. `docs(site): define balanced landing redesign`
   - this approved specification only;
   - Markdown review and `git diff --check`;
   - ordinary push and upstream parity proof.
2. `feat(site): reshape landing shell and hero`
   - shared header, mobile overlay, type assets, hero hierarchy, styles, and
     coupled generator tests;
   - full site tests and desktop/mobile browser checks.
3. `feat(site): stage terminal workflow as a product theater`
   - localized step rail, controller synchronization, sticky desktop layout,
     mobile fallback, and coupled tests;
   - full site tests plus normal and reduced-motion browser checks.
4. `feat(site): complete landing states and legal routes`
   - remaining landing polish, Privacy, Terms, branded 404, metadata, sitemap,
     footer links, and coupled tests;
   - full site tests and route/accessibility/browser checks.
5. A corrective `fix(site)` checkpoint is created only when final local or
   production verification exposes a real defect. Published checkpoints are
   never rewritten.
