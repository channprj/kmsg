import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const contentUrl = new URL("../app/content/document-content.json", import.meta.url)
const readmeUrl = new URL("../../README.md", import.meta.url)

test("synced Markdown content covers every documentation route", async () => {
  const entries = JSON.parse(await readFile(contentUrl, "utf8"))

  assert.equal(entries.length, 20)
  assert.deepEqual(
    [...new Set(entries.map(({ locale }) => locale))].sort(),
    ["cn", "en", "jp", "ko"],
  )
  assert.ok(entries.every(({ headings, html }) => headings.length > 0 && html.length > 500))
})

test("synced Markdown stays safe and keeps accessible rich content", async () => {
  const entries = JSON.parse(await readFile(contentUrl, "utf8"))
  const architecture = entries.find(
    ({ locale, pageKey }) => locale === "cn" && pageKey === "architecture",
  )
  const usage = entries.find(
    ({ locale, pageKey }) => locale === "en" && pageKey === "usage",
  )

  assert.match(architecture.html, /id="设计决策"/)
  assert.match(architecture.html, /role="region"/)
  assert.match(usage.html, /data-code-copy/)
  assert.doesNotMatch(entries.map(({ html }) => html).join("\n"), /<script\b/i)

  for (const entry of entries) {
    const regionNames = [
      ...entry.html.matchAll(/role="region" aria-label="([^"]+)"/g),
    ].map(([, label]) => label)
    assert.equal(
      regionNames.length,
      new Set(regionNames).size,
      `${entry.locale}/${entry.pageKey} must give every table region a unique name`,
    )
  }
})

test("repository README owns the brand signature without duplicating it into site content", async () => {
  const [readme, entries] = await Promise.all([
    readFile(readmeUrl, "utf8"),
    readFile(contentUrl, "utf8").then(JSON.parse),
  ])

  assert.match(readme, /<p data-brand-signature>/)
  assert.match(readme, /kmsg-signature-light\.svg#gh-light-mode-only/)
  assert.match(readme, /kmsg-signature-dark\.svg#gh-dark-mode-only/)
  assert.doesNotMatch(
    entries.map(({ html }) => html).join("\n"),
    /data-brand-signature|kmsg-signature-(?:light|dark)/,
  )
})
