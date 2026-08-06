# KMSG homepage navigation and story discovery

Status: Initial scroll design approved on 2026-08-04. Revised story discovery
scope approved by the user on 2026-08-06. Scroll activation was refined after
mobile production verification on 2026-08-06.

## Context

The homepage hero exposes a localized installation action as a semantic anchor
with `href="#install"`. Its target is the existing installation section near
the end of the page. The browser currently jumps to that section immediately,
which feels abrupt relative to the site's restrained motion system.

The real-world stories section currently renders the localized “See more
examples” action once inside each featured YouTube card. Each copy links to that
card's YouTube video, so the label does not describe its destination and there
is no longer one route to broader case discovery. An earlier site version used
one centered, new-tab Google search link below the featured stories.

## Goal

Improve two homepage navigation moments:

1. Make the hero installation action scroll smoothly to the existing
   installation section while preserving the anchor link, URL hash, keyboard
   behavior, static output, and reduced-motion accessibility.
2. Make each featured story card link directly to its YouTube video while
   restoring one centered Google discovery action below the complete story
   grid.

## Success criteria

- Activating the hero installation link scrolls smoothly to `#install`.
- The installation section stops below the fixed site header with about `6rem`
  of top clearance.
- The original `href="#install"` and target `id="install"` remain intact.
- Keyboard activation and opening or copying the anchor URL continue to use
  native browser behavior.
- `prefers-reduced-motion: reduce` changes the movement to an immediate jump.
- The behavior works at desktop, 390px, and 320px viewport widths without
  introducing horizontal overflow.
- Each featured story card is one accessible link to its own YouTube URL and
  opens in a new tab.
- No “See more examples” action appears inside an individual story card.
- Exactly one localized “See more examples” button appears centered below the
  story grid.
- The single discovery button opens this historical Google query in a new tab:
  `"kmsg 카카오톡" OR "kmsg 카톡" OR "kmsg 카카오"`.
- Every new-tab story and discovery link uses `rel="noopener noreferrer"`.
- Other homepage content, animations, themes, locales, and navigation remain
  unchanged.

## Approaches considered

### CSS-owned scrolling with scoped activation repair (selected)

Set the document scroll behavior to `smooth`, give `#install` a scroll margin
that clears the fixed header, and restore `auto` scrolling in the existing
reduced-motion media query. Production verification found that native fragment
activation could stop before the target at 390px and 320px even though direct
`scrollIntoView` reached the correct position. A scoped click handler therefore
repairs unmodified primary activation while CSS remains the single source of
smooth versus immediate motion. No animation dependency is added.

### JavaScript `scrollIntoView`

Intercept the installation link click and call `scrollIntoView` with explicit
options. This could scope animation to one link, but it would add event and hash
synchronization code for behavior the browser already provides.

### Animation-library timeline

Drive the document position through an animation library. This would provide
custom duration and easing, but would be disproportionate for a single anchor
transition and would add runtime complexity.

### Story discovery layout

Wrapping each complete story card in its existing YouTube anchor was selected
over linking only the image or title. It gives the large visual card one clear
destination, preserves direct access to both featured videos, and avoids
multiple links with duplicate accessible names inside one card.

Removing direct video links and leaving only the Google action was rejected
because the featured stories would no longer open their source videos. Keeping
one “See more examples” action per card was rejected because those labels point
to individual YouTube videos rather than broader examples.

## Design

The existing hero anchor and installation section markup remain unchanged.
Global document scrolling uses native smooth behavior. For an unmodified
primary click, the anchor handler preserves `#install` in browser history and
calls `scrollIntoView({ block: "start" })`; it intentionally omits an explicit
`behavior` option so the document CSS still owns motion. Modified clicks and a
missing target fall back to the anchor's native behavior. The `#install` target
receives a `scroll-margin-top` of `6rem`, placing its top below the fixed header
rather than flush against the viewport edge.

The existing `prefers-reduced-motion: reduce` media query sets document scroll
behavior back to `auto`. This ensures the target still moves into view and
receives the same header clearance without animated travel.

The handler does not manipulate focus, synthesize a duration, or replace the
semantic link. Browsers without smooth scrolling still receive a functional
immediate `scrollIntoView`, while copying or opening the fragment link retains
the original `href="#install"` contract.

Each story entry renders as one external anchor wrapping its visual card. The
anchor's accessible name is composed from the existing publisher and localized
title; its decorative thumbnail keeps an empty alternative. The card contains
no nested link or button, and keyboard focus receives a visible outline.

After the story grid, one centered button-style anchor uses the localized
`moreStoriesAction` label and an external-link icon. It opens the exact
historical discovery URL:

```text
https://www.google.com/search?q=%22kmsg+%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%86%A1%22+OR+%22kmsg+%EC%B9%B4%ED%86%A1%22+OR+%22kmsg+%EC%B9%B4%EC%B9%B4%EC%98%A4%22
```

Both story links and the discovery action open in new tabs with
`rel="noopener noreferrer"`. Story data and the restored search URL remain
source constants consumed by the homepage. Tests verify their rendered
destinations and security attributes.

## Verification

Automated tests will assert the link-to-target contract, scoped activation,
fragment update, target call, native smooth-scroll CSS, the `6rem` target
offset, and the reduced-motion override. They will also
assert two whole-card YouTube links, exactly one discovery action outside the
cards, the historical Google URL, localized labels, new-tab security
attributes, and the absence of nested interactive elements. The full site gate
must build all static routes, typecheck, and pass Vitest and Node tests.

Local browser verification will click the rendered installation action and
sample scroll position immediately, during movement, and after settlement. It
will confirm the final installation-section offset, `#install` URL fragment,
zero horizontal overflow, and reduced-motion immediate movement at desktop,
390px, and 320px widths. It will also verify whole-card keyboard focus, each
YouTube destination, a single centered Google action, new-tab creation, and
responsive story layout. The same behavior will be checked on GitHub Pages
after CI and deployment succeed for the implementation commits.

## Realtime checkpoints

1. `docs(site): define smooth install navigation` publishes the initial
   approved scroll design.
2. `docs(site): expand homepage interaction design` publishes the approved
   story-discovery revision.
3. `docs(site): plan homepage interaction improvements` publishes the reviewed
   TDD and deployment steps.
4. `feat(site): smooth-scroll install navigation` publishes the tested anchor
   scrolling behavior and regression coverage.
5. `fix(site): restore centralized story discovery` publishes whole-card video
   links and the single historical Google action.
6. `fix(site): keep install scroll aligned on mobile` publishes the
   verification-driven activation repair and regression test.
7. `docs(site): document reliable install scrolling` records the verified
   implementation decision without rewriting published history.

If verification reveals a regression after a checkpoint is published, the fix
will be a new ordinary commit and push. Published history will not be amended or
force-pushed.

## Non-goals

- No change to installation wording, command, card content, or section order.
- No custom duration, easing curve, scroll listener, focus transfer, or route
  transition.
- No change to featured story publishers, titles, images, YouTube URLs, order,
  or locale copy.
- No embedded YouTube player, Google result scraping, custom search page, or
  same-tab external navigation.
- No change to the tagline scrub, footer wordmark, theme persistence, locale
  selection, Swift CLI, MCP server, packaging, versioning, or releases.
