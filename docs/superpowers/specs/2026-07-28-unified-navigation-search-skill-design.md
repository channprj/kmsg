# Unified Navigation, Search, and Skill Documentation Design

**Date:** 2026-07-28
**Status:** Approved

## Purpose

Bring the KMSG homepage and documentation into one coherent product system while
improving search and answer-engine discoverability. The work must preserve the
existing restrained editorial-terminal direction, four-locale routing, theme
persistence, terminal replay, and static GitHub Pages deployment.

The user-visible outcomes are:

- use `$` for every homepage replay prompt and increase terminal line height to
`1.2`;
- move the install and usage actions to a centered row at the bottom of the
hero;
- give real-world story cards equal geometry and a consistent `16:9` thumbnail
frame;
- add a localized “more examples” action that opens the requested Google search
in a new tab;
- expose the same five navigation destinations on every page;
- add a dedicated Skill guide in Korean, English, Japanese, and Simplified
Chinese; and
- strengthen SEO and answer-engine readiness using accurate, visible, and
crawlable content rather than search-only copy.

## Design Principles

### One product shell

Home and documentation pages use the same header structure, navigation order,
controls, active state, responsive behavior, and footer conventions. Page
templates may retain different content layouts, but should no longer look like
separate sites.

### Editorial terminal, with controlled density

Keep the black, off-white, and Kakao yellow palette; IBM Plex typography; thin
rules; restrained radii; and Ghostty-inspired command surfaces. Consistency comes
from shared geometry and rhythm rather than adding decorative effects.

### Search quality follows content quality

Google states that its normal SEO practices apply to AI search features and that
no special AI schema or machine-readable file is required. Bing recommends clear
headings, tables, FAQ sections, accurate evidence, freshness, and low ambiguity.
Accordingly, the implementation will align structured data with visible content,
make important answers directly readable in HTML, and improve internal linking.
It will not add keyword stuffing, invented reviews, ratings, or unsupported
schema.

References:

- [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features?hl=en)
- [Google: SoftwareApplication structured data](https://developers.google.com/search/docs/appearance/structured-data/software-app)
- [Bing: AI Performance and content guidance](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview)
- [OpenAI: crawler access guidance](https://help.openai.com/en/articles/20001243-advertiser-guidance-for-allowing-openai-web-crawlers)

## Information Architecture

### Shared primary navigation

Every generated page renders these destinations in this order:

1. Usage
2. Architecture
3. MCP
4. Skill
5. GitHub ↗

Labels are localized for all four site languages except the product terms MCP,
Skill, and GitHub. Internal destinations preserve the current locale:


| Navigation item | Destination                 |
| --------------- | --------------------------- |
| Usage           | localized `/usage/`         |
| Architecture    | localized `/architecture/`  |
| MCP             | localized `/mcp/`           |
| Skill           | localized `/skill/`         |
| GitHub ↗        | repository URL in a new tab |


The MCP document keeps its existing Markdown sources but uses `/mcp/` as its
canonical public route in every locale. Legacy localized `/openclaw/` routes
redirect to the corresponding `/mcp/` route and remain excluded from the
sitemap so search and answer engines receive one canonical URL.

The current internal page receives `aria-current="page"` and a persistent yellow
active marker. The GitHub link retains `target="_blank"` and
`rel="noopener noreferrer"`.

### New Skill routes

The generator adds one `docs` page definition with these canonical routes:

- `/skill/`
- `/en/skill/`
- `/jp/skill/`
- `/cn/skill/`

Each route has a dedicated Markdown source under `site/content/<locale>/skill.md`.
The guide covers:

- the binary prerequisite and Accessibility permission;
- global installation for Claude Code and Codex;
- `/kmsg` for Claude Code and `$kmsg` for Codex;
- chat discovery and recent-message reading;
- dry-run before sending;
- a short troubleshooting path; and
- links to Usage, MCP, and the repository.

The locale selector maps Skill pages to the corresponding Skill route, just as it
does for existing documents.

## Shared Header and Responsive Navigation

Remove the home-only header variants:

- both templates use the same sticky full-width header;
- both use the same language control and icon-based theme control;
- LLM discovery remains in document metadata and the footer rather than taking a
home-inconsistent header slot;
- GitHub becomes the fifth textual navigation item instead of a separate home
icon; and
- header dimensions, border, blur, and scrolled state are shared.

At desktop widths, the header remains a three-column brand / navigation / tools
grid. At narrower widths, the navigation becomes a second header row that can
scroll horizontally. All five destinations remain visible and keyboard
reachable instead of disappearing behind a breakpoint.

## Homepage Refinements

### Hero actions

The headline and description keep their current asymmetric editorial placement.
The action group moves to its own final grid row spanning all twelve columns.
The install button and Usage link are centered as one balanced pair at the
visual bottom of the hero. Mobile retains the same order and centered alignment.

### Terminal replay

All replay command prompts, including the final empty prompt, render `$` instead
of `❯`. The terminal body uses `line-height: 1.2` at every viewport. Typing,
replay cancellation, reduced-motion behavior, and localized command content do
not change.

### Real-world stories

The story grid uses equal-width columns and removes the second-card vertical
offset. Every story media link has the same `16:9` aspect ratio, clips overflow,
and uses `object-fit: cover`. Copy areas use matching minimum heights so the card
baseline is stable even when localized titles wrap differently.

A localized tertiary action appears below the cards. It opens:

`https://www.google.com/search?q=kmsg+%EC%B9%B4%EC%B9%B4%EC%98%A4`

in a new tab with `rel="noopener noreferrer"`. The visible label conveys “more
examples” in each locale and includes an external-link arrow.

### Visible FAQ

The homepage currently emits FAQ JSON-LD extracted from README content without
rendering those questions in the custom product homepage. This violates the
principle that structured data should match visible page content.

Render the localized extracted FAQ near the bottom of the product page using
semantic heading and disclosure elements. Answers remain in the DOM even when a
disclosure is collapsed. The existing FAQ JSON-LD can then accurately describe
the visible section. The FAQ uses the same section-heading and rule system as
the rest of the homepage rather than introducing card chrome.

## Documentation Visual System

Documentation keeps its useful hero, sticky table of contents, and readable
article width. Consistency work is intentionally targeted:

- use the shared header and navigation;
- align document code blocks with the homepage terminal palette and radius;
- use the same accent rules, focus states, control geometry, and footer rhythm;
- mark the active primary destination;
- preserve horizontal scrolling for tables and mobile table-of-contents chips;
and
- ensure the new Skill guide follows the same article template.

No Markdown content is moved into bespoke per-page components. The static
generator remains the single rendering path.

## SEO and Answer-Engine Design

### Crawl and discovery

- Keep canonical URLs, `hreflang`, `x-default`, robots directives, and sitemap
entries on every localized page.
- Add the four Skill routes to sitemap, LLM indexes, locale navigation, and
internal links.
- Explicitly allow `OAI-SearchBot` and `ChatGPT-User` in `robots.txt` while
retaining the general `User-agent: *` rule and sitemap location.
- Keep important product and FAQ answers as server-rendered text.

### Metadata

- Preserve unique localized titles and descriptions for every page.
- Add complete social image metadata: MIME type, pixel dimensions, and image
alt text for Open Graph and Twitter.
- Emit alternate Open Graph locales.
- Keep `max-image-preview`, `max-snippet`, and `max-video-preview` enabled.
- Avoid obsolete `keywords` metadata.

### Structured data

Maintain one connected `@graph` with stable identifiers for Person, WebSite,
SoftwareApplication, SoftwareSourceCode, and WebPage or TechArticle.

Enhance only with verifiable properties:

- `image`, `featureList`, `softwareRequirements`, and localized `inLanguage`
where they match visible product information;
- `mainEntity` on the homepage pointing at the software entity;
- accurate `dateModified` on document pages;
- breadcrumbs that match the visible information architecture; and
- FAQPage only where the FAQ is visibly rendered.

Do not add aggregate ratings, testimonials as Review schema, or a HowTo type.
Those would overstate the available evidence or use search features that do not
fit the page.

### Machine-readable surfaces

The existing `llm.txt`, `llms.txt`, and `llms-full.txt` remain supplemental
discovery surfaces. They gain the Skill routes and retain direct summaries and
canonical links. They are not described as a ranking mechanism.

## Accessibility and Interaction

- All header navigation remains reachable without a pointer.
- Horizontal mobile navigation uses an explicit accessible label and visible
focus state.
- External actions contain a textual label, not only an icon.
- FAQ disclosures use native `details` and `summary`.
- Story images retain meaningful localized alternative text and explicit
dimensions.
- Theme, language, copy, and replay controls retain static accessible names and
localized feedback.
- `prefers-reduced-motion` continues to disable nonessential animation.

## Data Flow

1. Page definitions declare locale sources, titles, descriptions, and route

  identity.
2. Markdown is parsed and sanitized as it is today.
3. Home README FAQ content is extracted once and passed to both the visible FAQ

  renderer and JSON-LD generator.
4. The shared header resolves each navigation destination relative to the

  current localized output.
5. The generator writes all canonical pages, redirects, sitemap, robots,

  manifest, and LLM discovery files.
6. The existing client script handles theme, locale persistence, copy controls,

  table/TOC behavior, and replay without owning any indexable content.

## Failure Handling

- The build fails when any locale lacks a Skill source or translation metadata.
- Tests reject a page if the shared five-link navigation is incomplete or
ordered differently.
- Tests reject FAQ JSON-LD when the matching visible FAQ section is absent.
- Tests verify the exact external search URL and new-tab security attributes.
- Generated route and sitemap coverage must account for all six page types
across four locales.
- Missing source image dimensions or social metadata fail the site contract
tests.

## Verification

### Automated

- `npm test --prefix site`
- `swift build`
- `git diff --check`
- parse JSON-LD for every generated page;
- validate canonical, alternate, sitemap, robots, and LLM route coverage;
- assert all localized pages render the same ordered GNB; and
- assert prompt, line-height, story ratio, CTA, and new-tab contracts.

### Browser

Use Chromium at 1440×1000, 768×1024, 390×844, and 320×800:

- homepage, Usage, MCP, and Skill templates;
- dark and paper themes;
- Korean, English, Japanese, and Chinese routes;
- mobile navigation exposure and horizontal overflow containment;
- centered hero actions;
- terminal replay and `$` prompts;
- equal story cards and working “more examples” action;
- FAQ keyboard behavior;
- locale persistence and same-document mapping;
- no console errors and no page-level horizontal overflow.

### Production

After every verified checkpoint, push the explicit branch ref because this
repository also has a `main` tag. After the final checkpoint:

- confirm `HEAD`, `origin/main`, and the live remote branch are identical;
- wait for Swift CI and GitHub Pages to succeed;
- request all canonical locale and Skill routes from production;
- repeat representative 1440px and 390px browser checks against the deployed
site; and
- confirm the final worktree is clean with upstream parity `0 0`.

## Acceptance Criteria

The work is complete only when:

- every replay prompt is `$` and computed line height reflects `1.2`;
- hero actions are centered in their own bottom row;
- both story cards have equal width, equal media ratio, and no staggered offset;
- the localized “more examples” action opens the exact requested URL in a new
tab;
- all generated pages expose the same five navigation items in the same order;
- four localized Skill pages render and switch locale correctly;
- home FAQ text is visible and matches FAQ structured data;
- metadata, structured data, robots, sitemap, and LLM outputs pass the expanded
automated contract;
- desktop, tablet, and mobile browser verification passes in both themes;
- CI and Pages succeed for the final commit; and
- `main` is clean and exactly matches the remote branch.
