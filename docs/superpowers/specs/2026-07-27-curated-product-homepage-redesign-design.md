# Curated product homepage redesign

Status: Approved by the user on 2026-07-27.

## Context

The KMSG site currently combines a large technical hero with a rendered copy of
the project README. The result exposes all repository content on the homepage,
uses oversized “AI Native” messaging, and gives the terminal treatment more
visual weight than the product itself. On mobile, the headline breaks
awkwardly, the actions and command repeat the same installation intent, and the
long README flow feels like documentation rather than a product homepage.

The redesign takes the information rhythm of
`https://markdowner.chann.dev` as its reference: a compact product header,
direct centered value proposition, real product surface, concise proof cards,
focused capability sections, social proof, and a final installation action.
KMSG keeps its own identity, content, routes, and Kakao yellow accent rather than
copying Markdowner branding or assets.

## Goals

- Replace the AI-styled homepage with a restrained product landing page.
- Make the purpose of KMSG understandable without reading repository prose.
- Follow the reference site's structural sequence as closely as KMSG content
  allows.
- Use direct factual copy and remove decorative or repetitive marketing text.
- Keep desktop and mobile layouts equally intentional and free of overflow.
- Preserve the four locales, dark and light themes, SEO/AEO metadata, LLM
  resources, documentation routes, and static GitHub Pages architecture.
- Retain real KMSG evidence: the `chats → read → send` workflow, Homebrew
  command, native MCP support, structured output, and user story videos.

## Non-goals

- No framework migration, client-side router, analytics, or account features.
- No change to the CLI, MCP server, release process, or Accessibility behavior.
- No removal or rewrite of the canonical README files.
- No imitation of Markdowner's logo, product screenshots, wording, or exact
  visual assets.
- No new release tag or version bump.

## Chosen direction

The selected direction is **direct product translation**.

The homepage becomes a dedicated product page rather than a styled README. Its
sequence is:

1. compact capsule header;
2. centered product identity and factual value proposition;
3. one primary installation action and current version;
4. wide real CLI workflow;
5. three concise product principles;
6. focused read, watch, and send capability sections;
7. compact real-world user stories;
8. final Homebrew installation card with requirements and disclaimer;
9. restrained footer.

Long installation notes, FAQ entries, architecture explanations, and reference
material remain available through the existing documentation routes.

## Information architecture

### Header

The header is a centered capsule within the page width. It contains:

- KMSG logo and name;
- Usage and MCP navigation;
- locale selector;
- theme control;
- GitHub link.

Architecture and machine-readable resources remain reachable through
documentation and footer links. The mobile header retains the brand, locale,
theme, and GitHub actions without introducing a menu or secondary row.

### Hero

The hero is centered and uses one `h1`. The Korean headline is:

> 카카오톡을 터미널에서 읽고, 감시하고, 보냅니다.

Equivalent localized copy states the same concrete actions without an
“AI-native” slogan. A short supporting sentence identifies KMSG as an
unofficial macOS CLI and native MCP server using the Accessibility API.

The primary action copies or focuses the Homebrew installation command. A
secondary text link opens Usage documentation. The current version appears
below the action as quiet product metadata. The logo is used as a small product
anchor, not as a large decorative illustration.

### Product workflow

The existing real `kmsg chats`, `kmsg read`, and `kmsg send` transcript remains
the main product surface. It moves below the centered hero in a wide,
screen-like frame similar in hierarchy to a product screenshot.

The replay:

- shows the three commands and representative localized output;
- remains readable without animation;
- uses restrained borders and shadow instead of scan lines or neon glow;
- pauses motion for `prefers-reduced-motion`;
- never requires interaction to understand the completed workflow;
- uses a shorter mobile viewport while preserving horizontal readability.

### Product principles

Three equal cards explain only:

1. **Local on macOS** — controls the visible KakaoTalk app through the macOS
   Accessibility API.
2. **CLI and native MCP** — works from the terminal, scripts, and compatible
   agents without a bridge service.
3. **Structured output** — separates JSON or text output from AX diagnostics
   for automation.

Cards use small functional glyphs or command tokens, not generic illustrations.

### Capability sections

Three capability sections translate real commands into product evidence:

- **Read** — chat discovery, stable local `chat_id`, and recent messages.
- **Watch** — live message monitoring with background-safe behavior.
- **Send** — dry-run-aware text and image delivery through visible UI.

Desktop alternates text and command/output panels in two columns. Mobile always
stacks the heading before its panel so the reading order remains logical. Each
section has one short paragraph and no more than three factual points.

### Real-world stories

The two existing YouTube stories remain as a two-card section with their
original links, thumbnails, publishers, and titles. The section introduces
them with one factual sentence. Mobile stacks the cards.

### Installation close

The final card contains:

- `brew install channprj/tap/kmsg`;
- a copy control;
- links to Usage and the latest GitHub release;
- requirements: macOS 13+, KakaoTalk for macOS, Accessibility permission;
- a concise statement that KMSG is an independent unofficial project.

The homepage does not repeat the full FAQ, architecture rationale, or license
prose. Those remain linked from the footer and documentation.

## Visual system

The page uses a refined dark product aesthetic rather than an industrial
terminal grid.

- Canvas: near-black in dark mode and warm off-white in light mode.
- Surface: subtly raised neutral panels with one-pixel borders.
- Accent: Kakao yellow only for the primary action, tiny state marks, and
  focused emphasis.
- Type: a readable Korean sans face for UI and prose, paired with a disciplined
  monospace face for commands and metadata. Korean body copy no longer uses a
  coding font.
- Shape: capsule header, moderate 12–20px radii, and consistent panel geometry.
- Motion: one restrained hero/workflow entrance and small hover transitions.
- Decoration: no background grid, scan beam, large glow field, gradient text,
  or oversized slogan.

The maximum content width is 1120px. Normal section spacing is
80–96px on desktop and 56–64px on mobile. No section uses viewport-height
spacing, and empty space must support hierarchy rather than act as decoration.

## Responsive behavior

### Desktop, 1100px and wider

- Header and content cap at the same centered width.
- Hero copy caps at a readable line length.
- Workflow spans the main content width.
- Principle cards use three columns.
- Capability sections use balanced two-column compositions.
- Story cards use two columns.

### Tablet, 760px to 1099px

- Header navigation is reduced before controls wrap.
- Capability columns narrow without reducing command text below a readable
  size.
- Principle and story cards remain multi-column with a 210px minimum width.

### Mobile, 320px to 759px

- Header keeps one row and prioritizes brand plus essential controls.
- Hero headline uses deliberate locale-specific wrapping.
- Buttons and install command fit the content width.
- Workflow, cards, capability sections, and stories use one column.
- Code panels scroll internally only when a command cannot wrap safely.
- Tap targets are at least 44px tall.
- The page has no horizontal overflow at 320px, 375px, or 390px.

## Generated content and data flow

The Node static-site generator remains the source of all HTML.

1. Markdown sources continue to produce documentation pages, discovery files,
   structured data, and FAQ data.
2. Homepage translations and product facts live in explicit locale data inside
   `site/build.mjs`.
3. A dedicated homepage renderer produces curated sections instead of passing
   the full README HTML into the homepage body.
4. Documentation pages continue to use the Markdown renderer, table of
   contents, source links, and existing layouts.
5. Shared CSS handles theme, header, footer, code panels, focus states, and
   responsive layout.
6. Shared JavaScript retains theme, locale, copy, and terminal replay behavior
   with no required client-side rendering.

If source extraction is needed for video stories, the build must fail clearly
when expected entries are absent rather than silently publishing an incomplete
section.

## Accessibility

- Exactly one `h1` appears on every page.
- Landmarks, heading order, and semantic anchors remain intact.
- Buttons are used only for actions such as copying; navigation uses links.
- All controls have localized accessible names and visible keyboard focus.
- Dark and light themes meet WCAG AA contrast for normal text and controls.
- Terminal color is never the only carrier of meaning.
- Motion has a complete reduced-motion fallback.
- Video links retain descriptive alternative text.
- Horizontal code scrolling remains keyboard accessible.

## SEO and compatibility

- Existing canonical URLs, `lang`, `hreflang`, Open Graph, Twitter, JSON-LD,
  sitemap, robots, `llm.txt`, `llms.txt`, and `llms-full.txt` outputs remain.
- The Korean root and `/en/`, `/jp/`, and `/cn/` homepages use equivalent
  curated structures.
- `/ko/` remains a redirect to the canonical Korean root.
- README source links and documentation pages are unchanged.
- Homepage structured data continues to derive factual project and FAQ
  information even when the visual homepage no longer renders the full FAQ.

## Failure handling

- Missing localized homepage data fails the build.
- Missing user story media or malformed external links fails the relevant
  generator test.
- JavaScript enhancement failures leave theme defaults, visible terminal
  content, links, and installation text usable.
- External fonts fall back to locale-appropriate sans and monospace stacks.
- External video thumbnails do not affect the layout because aspect ratios are
  reserved in CSS.

## Verification

Automated tests must prove:

- every locale renders the curated homepage sections exactly once;
- the old “AI Native” hero is absent;
- homepage HTML does not render the full README table of contents or FAQ body;
- documentation pages still render their Markdown content and table of
  contents;
- the workflow includes `chats`, `read`, and `send`;
- both existing user stories and Homebrew installation command remain;
- locale routes, theme controls, metadata, discovery files, and redirects
  remain valid;
- generated HTML contains no duplicate IDs or unsafe links.

Browser verification covers:

- desktop at 1440×1000 in both themes;
- mobile at 390×844 and a narrow 320px overflow check;
- localized desktop and mobile smoke checks for all four locales;
- header controls, locale switching, theme persistence, copy behavior, Usage
  and GitHub links;
- terminal readability with normal and reduced motion;
- keyboard navigation and WCAG A/AA automated auditing;
- production Pages output after the pushed commit deploys.

## Realtime checkpoint strategy

1. Commit and push this approved design.
2. Commit and push the implementation plan.
3. Implement generator, styles, script behavior, and tests as one green
   user-visible homepage outcome; commit and push immediately.
4. Create a separate corrective commit only for defects found during browser or
   production verification.
