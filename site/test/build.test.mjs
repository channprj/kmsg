import assert from "node:assert/strict"
import { access, readFile, readdir } from "node:fs/promises"
import { join, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const siteDir = resolve(fileURLToPath(new URL("..", import.meta.url)))
const distDir = join(siteDir, "dist")
const readOutput = (path) => readFile(join(distDir, path), "utf8")

const localePrefixes = ["", "en/", "jp/", "cn/"]
const pageSlugs = ["", "usage/", "architecture/", "mcp/", "skill/", "versioning/", "privacy/", "terms/"]
const canonicalFiles = localePrefixes.flatMap((prefix) =>
  pageSlugs.map((slug) => `${prefix}${slug}index.html`),
)
const canonicalMarkdownFiles = canonicalFiles.map((path) =>
  path.replace(/index\.html$/, "index.md"),
)
const legacyAliasFiles = [
  "ko/index.html",
  "ko/usage/index.html",
  "ko/architecture/index.html",
  "ko/mcp/index.html",
  "ko/openclaw/index.html",
  "ko/skill/index.html",
  "ko/versioning/index.html",
  "ko/privacy/index.html",
  "ko/terms/index.html",
  "openclaw/index.html",
  "en/openclaw/index.html",
  "jp/openclaw/index.html",
  "cn/openclaw/index.html",
]

const visibleText = (html) =>
  html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:amp|lt|gt|quot|#39|#x27);/gi, " ")
    .replace(/\s+/g, " ")
    .trim()

test("React build emits every canonical page and compatibility artifact", async () => {
  const compatibilityFiles = [
    ...legacyAliasFiles,
    "404.html",
    "robots.txt",
    "sitemap.xml",
    "llm.txt",
    "llms.txt",
    "llms-full.txt",
    "site.webmanifest",
    ".nojekyll",
  ]
  const assets = [
    "assets/favicon.svg",
    "assets/kmsg-logo.jpg",
    "assets/kmsg-workspace.webp",
    "assets/demo1.mp4",
    "assets/demo-captions.vtt",
  ]

  await Promise.all(
    [...canonicalFiles, ...canonicalMarkdownFiles, ...compatibilityFiles, ...assets].map((path) =>
      access(join(distDir, path)),
    ),
  )
})

test("canonical HTML is the localized React and Shadcn artifact", async () => {
  const [home, docs, chinese] = await Promise.all([
    readOutput("index.html"),
    readOutput("en/usage/index.html"),
    readOutput("cn/architecture/index.html"),
  ])

  assert.match(home, /data-slot="dropdown-menu-trigger"/)
  assert.match(home, /data-footer-wordmark="true"/)
  assert.doesNotMatch(home, /<select\b/)
  assert.equal((home.match(/<h1\b/g) ?? []).length, 1)
  assert.ok(visibleText(home).length >= 500)
  assert.doesNotMatch(home, /http-equiv="refresh"/i)
  assert.match(
    home,
    /<link(?=[^>]*rel="alternate")(?=[^>]*type="text\/markdown")(?=[^>]*href="\/kmsg\/index\.md")[^>]*>/,
  )
  assert.match(home, /<link[^>]*rel="describedby"[^>]*href="\/kmsg\/llms\.txt"/)
  assert.match(home, /<meta name="twitter:card" content="summary_large_image"/)
  assert.match(home, /<meta property="og:image" content="https:\/\/channprj\.github\.io\/kmsg\/assets\/kmsg-logo\.jpg"/)
  assert.match(docs, /data-code-copy/)
  assert.match(docs, /role="region"/)
  assert.match(
    chinese,
    /<link rel="canonical" href="https:\/\/channprj\.github\.io\/kmsg\/cn\/architecture\/"/,
  )
  assert.match(chinese, /<meta property="og:locale" content="zh_CN"/)
})

test("legacy aliases serve complete prerendered pages without meta refresh", async () => {
  const aliases = await Promise.all(legacyAliasFiles.map(readOutput))

  for (const html of aliases) {
    assert.doesNotMatch(html, /http-equiv="refresh"/i)
    assert.match(html, /<h1\b/)
    assert.ok(visibleText(html).length >= 200)
  }
})

test("hashed application assets referenced by HTML exist", async () => {
  const html = await readOutput("index.html")
  const references = [...html.matchAll(/(?:href|src)="\/kmsg\/(assets\/[^"]+)"/g)].map(
    ([, path]) => path,
  )
  assert.ok(references.some((path) => path.endsWith(".css")))
  assert.ok(references.some((path) => path.endsWith(".js")))
  await Promise.all([...new Set(references)].map((path) => access(join(distDir, path))))

  const files = await readdir(join(distDir, "assets"))
  assert.ok(files.some((file) => /^root-.+\.css$/.test(file)))
  assert.ok(files.some((file) => /^entry\.client-.+\.js$/.test(file)))
  assert.ok(!files.includes("app.js"))
  assert.ok(!files.includes("styles.css"))
})

test("aliases, 404, and discovery files preserve public contracts", async () => {
  const [koRedirect, openclawRedirect, notFound, sitemap, llm, llmCompat, robots, homeMarkdown, mcpMarkdown, manifest, version] =
    await Promise.all([
      readOutput("ko/usage/index.html"),
      readOutput("cn/openclaw/index.html"),
      readOutput("404.html"),
      readOutput("sitemap.xml"),
      readOutput("llms.txt"),
      readOutput("llm.txt"),
      readOutput("robots.txt"),
      readOutput("index.md"),
      readOutput("mcp/index.md"),
      readOutput("site.webmanifest"),
      readFile(resolve(siteDir, "../VERSION"), "utf8"),
    ])

  assert.match(koRedirect, /<link rel="canonical" href="https:\/\/channprj\.github\.io\/kmsg\/usage\/"/)
  assert.match(openclawRedirect, /<link rel="canonical" href="https:\/\/channprj\.github\.io\/kmsg\/cn\/mcp\/"/)
  assert.match(notFound, /<meta name="robots" content="noindex,follow"/)
  assert.equal((notFound.match(/class="not-found-locale"/g) ?? []).length, 4)
  assert.match(notFound, /<pre[^>]*data-agent-recovery>/)
  assert.match(notFound, /\[Agent index]\(https:\/\/channprj\.github\.io\/kmsg\/llms\.txt\)/)
  assert.match(notFound, /\[Sitemap]\(https:\/\/channprj\.github\.io\/kmsg\/sitemap\.xml\)/)
  const sitemapEntries = [...sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)]
  assert.equal(sitemapEntries.length, 32)
  for (const [, location, lastModified] of sitemapEntries) {
    assert.equal(new URL(location).origin, "https://channprj.github.io")
    assert.ok(Number.isFinite(Date.parse(lastModified)))
  }
  assert.equal(llmCompat, llm)
  assert.ok(llm.startsWith("# kmsg\n\n>"))
  assert.ok(llm.includes(`Current version: ${version.trim()}`))
  assert.match(llm, /## When to use kmsg/)
  assert.match(llm, /\[Use the kmsg MCP server]\(https:\/\/channprj\.github\.io\/kmsg\/mcp\/index\.md\)/)
  assert.match(llm, /## Developer resources/)
  assert.match(llm, /kmsg authentication docs/)
  assert.match(llm, /https:\/\/channprj\.github\.io\/kmsg\/cn\/terms\/index\.md/)
  for (const userAgent of ["ChatGPT-User", "ClaudeBot", "Google-Extended", "ora-agent", "DeepSeekBot"]) {
    assert.match(robots, new RegExp(`User-agent: ${userAgent}\\nAllow: /`))
  }
  assert.match(homeMarkdown, /^#\s+kmsg/m)
  assert.match(mcpMarkdown, /^#\s+.+/m)
  assert.match(mcpMarkdown, /\bMCP\b/)
  assert.equal(JSON.parse(manifest).start_url, "/kmsg/")
})
