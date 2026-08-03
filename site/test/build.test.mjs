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

test("React build emits every canonical page and compatibility artifact", async () => {
  const compatibilityFiles = [
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
    [...canonicalFiles, ...compatibilityFiles, ...assets].map((path) =>
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

test("redirects, 404, and discovery files preserve public contracts", async () => {
  const [koRedirect, openclawRedirect, notFound, sitemap, llm, manifest] =
    await Promise.all([
      readOutput("ko/usage/index.html"),
      readOutput("cn/openclaw/index.html"),
      readOutput("404.html"),
      readOutput("sitemap.xml"),
      readOutput("llm.txt"),
      readOutput("site.webmanifest"),
    ])

  assert.match(koRedirect, /url=https:\/\/channprj\.github\.io\/kmsg\/usage\//)
  assert.match(openclawRedirect, /url=https:\/\/channprj\.github\.io\/kmsg\/cn\/mcp\//)
  assert.match(notFound, /<meta name="robots" content="noindex,follow"/)
  assert.equal((notFound.match(/class="not-found-locale"/g) ?? []).length, 4)
  assert.equal((sitemap.match(/<url>/g) ?? []).length, 32)
  assert.match(llm, /Current version: 1\.260729\.0/)
  assert.match(llm, /https:\/\/channprj\.github\.io\/kmsg\/cn\/terms\//)
  assert.equal(JSON.parse(manifest).start_url, "/kmsg/")
})
