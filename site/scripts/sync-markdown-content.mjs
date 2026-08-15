import { execFileSync } from "node:child_process"
import { readFile, writeFile } from "node:fs/promises"
import { dirname, posix, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { marked } from "marked"
import sanitizeHtml from "sanitize-html"

import legacyContent from "../app/content/legacy-content.json" with { type: "json" }

const siteDir = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const repoDir = resolve(siteDir, "..")
const outputPath = resolve(siteDir, "app/content/document-content.json")
const repositoryUrl = "https://github.com/channprj/kmsg"
const docsKeys = new Set(["usage", "architecture", "openclaw", "skill", "versioning"])

const routeKey = (pageKey) => (pageKey === "openclaw" ? "mcp" : pageKey)
const localePrefix = (locale) => (locale === "ko" ? "" : `${locale}/`)
const publicRoute = (locale, pageKey) =>
  `/kmsg/${localePrefix(locale)}${routeKey(pageKey)}/`

const markdownPageKey = (rawPath) => {
  const basename = posix.basename(rawPath.replaceAll("\\", "/")).toLowerCase()
  if (["usage.md", "usage"].includes(basename)) return "usage"
  if (["architecture.md", "architecture"].includes(basename)) return "architecture"
  if (["openclaw.md", "openclaw"].includes(basename)) return "openclaw"
  if (["skill.md", "skill"].includes(basename)) return "skill"
  if (["versioning.md", "versioning"].includes(basename)) return "versioning"
  return null
}

const stripTags = (value) =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim()

const slugify = (value) =>
  stripTags(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "") || "section"

const localizedAnchor = (anchor, locale) => {
  const anchors = {
    installation: {
      ko: "설치",
      en: "installation",
      jp: "インストール",
      cn: "安装",
    },
    "accessibility-instead-of-a-private-protocol": {
      ko: "비공개-프로토콜-대신-손쉬운-사용-api",
      en: "accessibility-instead-of-a-private-protocol",
      jp: "非公開プロトコルを使わない",
      cn: "不使用私有协议",
    },
  }
  return anchors[anchor]?.[locale] ?? anchor
}

function resolveMarkdownTarget(target, page) {
  if (/^(#|https?:\/\/|mailto:)/.test(target)) return target

  const [rawPath, anchor = ""] = target.split("#", 2)
  const targetPageKey = markdownPageKey(rawPath)
  const suffix = anchor ? `#${localizedAnchor(anchor, page.locale)}` : ""
  if (targetPageKey) return `${publicRoute(page.locale, targetPageKey)}${suffix}`

  const sourceRelativePath = posix.normalize(
    posix.join(posix.dirname(page.source), rawPath),
  )
  if (sourceRelativePath.startsWith("assets/")) {
    return `/kmsg/${sourceRelativePath}${suffix}`
  }
  return `${repositoryUrl}/blob/main/${sourceRelativePath}${suffix}`
}

function prepareMarkdown(markdown, page) {
  let skippedTitle = false
  let skippingBrandSignature = false
  const filtered = markdown.split("\n").filter((line) => {
    if (skippingBrandSignature) {
      if (line.trim() === "</p>") skippingBrandSignature = false
      return false
    }
    if (!skippedTitle && line.startsWith("# ")) {
      skippedTitle = true
      return false
    }
    if (/^\[!\[.+]\(https:\/\/img\.shields\.io\//.test(line)) return false
    if (/^\[(한국어|English)]\(.+\)$/.test(line)) return false
    if (line.trim() === "<p data-brand-signature>") {
      skippingBrandSignature = true
      return false
    }
    return true
  })

  return filtered
    .join("\n")
    .trim()
    .replace(
      /(!?\[[^\]]*])\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
      (match, label, target) => `${label}(${resolveMarkdownTarget(target, page)})`,
    )
}

const sanitizeOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    "img",
    "video",
    "source",
    "details",
    "summary",
    "kbd",
  ],
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    "*": ["id", "class", "aria-label", "aria-hidden", "data-language"],
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "width", "height", "loading", "decoding"],
    video: ["src", "controls", "preload", "playsinline", "poster"],
    source: ["src", "type"],
    code: ["class"],
  },
  allowedSchemes: ["http", "https", "mailto"],
}

function enhanceMarkdown(html, page) {
  const headingCounts = new Map()
  const headings = []
  let tableIndex = 0
  let enhanced = html.replace(
    /<h([2-4])>([\s\S]*?)<\/h\1>/g,
    (match, level, content) => {
      const baseSlug = slugify(content)
      const count = headingCounts.get(baseSlug) ?? 0
      headingCounts.set(baseSlug, count + 1)
      const id = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`
      headings.push({ level: Number(level), id, label: stripTags(content) })
      return `<h${level} id="${id}"><a class="heading-anchor" href="#${id}">${content}</a></h${level}>`
    },
  )

  enhanced = enhanced
    .replace(
      /<table>/g,
      () => {
        tableIndex += 1
        return `<div class="table-scroll" tabindex="0" role="region" aria-label="${page.localeConfig.ui.table} ${tableIndex}"><table>`
      },
    )
    .replace(/<\/table>/g, "</table></div>")
    .replace(
      /<pre><code/g,
      `<pre><button class="markdown-copy-button" type="button" aria-label="${page.localeConfig.ui.copy}" aria-live="polite" data-code-copy data-copied-label="${page.localeConfig.ui.copied}" data-copy-failed-label="${page.localeConfig.ui.copyFailed}"><span data-copy-label>${page.localeConfig.ui.copy}</span></button><code`,
    )
    .replace(
      /<a href="(https?:\/\/[^"]+)">/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">',
    )

  return { html: enhanced, headings }
}

function lastModifiedFor(source) {
  try {
    return execFileSync("git", ["log", "-1", "--format=%cI", "--", source], {
      cwd: repoDir,
      encoding: "utf8",
    }).trim()
  } catch {
    return new Date(0).toISOString()
  }
}

const pages = legacyContent.pages.filter(({ pageKey }) => docsKeys.has(pageKey))
const entries = []

for (const page of pages) {
  const markdown = await readFile(resolve(repoDir, page.source), "utf8")
  const title = markdown.match(/^#\s+(.+)$/m)?.[1] ?? page.title
  const prepared = prepareMarkdown(markdown, page)
  const safeHtml = sanitizeHtml(marked.parse(prepared), sanitizeOptions)
  const rendered = enhanceMarkdown(safeHtml, page)
  entries.push({
    locale: page.locale,
    pageKey: routeKey(page.pageKey),
    title,
    source: page.source,
    sourceLabel: page.sourceLabel ?? page.source,
    lastModified: lastModifiedFor(page.source),
    ...rendered,
  })
}

await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`)
console.log(`Synced ${entries.length} localized Markdown documents`)
