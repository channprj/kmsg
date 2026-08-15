import { execFileSync } from "node:child_process"
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { basename, dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import legacyContent from "../app/content/legacy-content.json" with { type: "json" }

const siteDir = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const repoDir = resolve(siteDir, "..")
const clientDir = resolve(siteDir, "build/client")
const prerenderDir = resolve(clientDir, "kmsg")
const distDir = resolve(siteDir, "dist")
const origin = "https://channprj.github.io"
const baseUrl = `${origin}/kmsg/`
const repositoryUrl = "https://github.com/channprj/kmsg"

if (basename(distDir) !== "dist" || dirname(distDir) !== siteDir) {
  throw new Error(`Refusing to replace unexpected output path: ${distDir}`)
}

const localePrefixes = { ko: "", en: "en/", jp: "jp/", cn: "cn/" }
const hrefLang = { ko: "ko", en: "en", jp: "ja", cn: "zh-CN" }
const pageSlugs = {
  home: "",
  usage: "usage/",
  architecture: "architecture/",
  openclaw: "mcp/",
  skill: "skill/",
  versioning: "versioning/",
  privacy: "privacy/",
  terms: "terms/",
}

const canonicalPages = legacyContent.pages.map((page) => ({
  ...page,
  publicPath: `${localePrefixes[page.locale]}${pageSlugs[page.pageKey]}`,
}))

function lastModified(source) {
  try {
    return execFileSync("git", ["log", "-1", "--format=%cI", "--", source], {
      cwd: repoDir,
      encoding: "utf8",
    }).trim()
  } catch {
    return new Date(0).toISOString()
  }
}

function redirectDocument(target, language = "en") {
  return `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=${target}"><link rel="canonical" href="${target}"><meta name="robots" content="noindex,follow"></head><body><p><a href="${target}">Continue to kmsg</a></p></body></html>`
}

async function write(relativePath, content) {
  const path = join(distDir, relativePath)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, content)
}

await rm(distDir, { recursive: true, force: true })
await mkdir(distDir, { recursive: true })
await cp(prerenderDir, distDir, { recursive: true })
await mkdir(join(distDir, "assets"), { recursive: true })
await cp(join(clientDir, "assets"), join(distDir, "assets"), { recursive: true })
await Promise.all([
  cp(resolve(repoDir, "assets/brand"), join(distDir, "assets/brand"), { recursive: true }),
  cp(resolve(repoDir, "assets/demo1.mp4"), join(distDir, "assets/demo1.mp4")),
])

for (const page of canonicalPages.filter(({ locale }) => locale === "ko")) {
  const target = `${baseUrl}${page.publicPath}`
  const legacyPath = `ko/${pageSlugs[page.pageKey]}index.html`
  await write(legacyPath, redirectDocument(target, "ko"))
}

for (const locale of Object.keys(localePrefixes)) {
  const prefix = localePrefixes[locale]
  const target = `${baseUrl}${prefix}mcp/`
  await write(`${prefix}openclaw/index.html`, redirectDocument(target, hrefLang[locale]))
  if (locale === "ko") {
    await write("ko/openclaw/index.html", redirectDocument(target, "ko"))
  }
}

const localeLinks = Object.entries(localePrefixes)
  .map(
    ([locale, prefix]) =>
      `<a class="not-found-locale" href="${baseUrl}${prefix}">${locale.toUpperCase()} · ${legacyContent.locales[locale].name}</a>`,
  )
  .join("")
await write(
  "404.html",
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page not found - kmsg</title><meta name="robots" content="noindex,follow"><link rel="icon" href="/kmsg/assets/favicon.svg" type="image/svg+xml"><style>html{color-scheme:dark;background:#11110f;color:#f7f7f2;font-family:system-ui,sans-serif}body{margin:0}.not-found-page{display:flex;min-height:100vh;box-sizing:border-box;flex-direction:column;justify-content:center;max-width:48rem;margin:auto;padding:2rem}.not-found-page img{border-radius:.75rem}.not-found-page h1{font-size:clamp(2.5rem,8vw,5rem);margin:.75rem 0}.not-found-page p{color:#aaa99f;line-height:1.7}.not-found-page nav{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:2rem}.not-found-locale{min-height:2.75rem;display:inline-flex;align-items:center;border:1px solid #35352e;border-radius:.75rem;padding:0 1rem;color:inherit;text-decoration:none}.not-found-locale:hover{background:#252520}</style></head><body><main class="not-found-page"><img src="/kmsg/assets/brand/png/kmsg-app-icon-64.png" alt="" width="64" height="64"><p>404</p><h1>Page not found</h1><p>The requested page does not exist. Choose a language to return to kmsg.</p><nav aria-label="Choose a kmsg homepage">${localeLinks}</nav></main></body></html>`,
)

const sitemapEntries = canonicalPages
  .map((page) => {
    const priority = page.pageKey === "home" ? "1.0" : "0.8"
    const frequency = page.pageKey === "home" ? "weekly" : "monthly"
    return `  <url>\n    <loc>${baseUrl}${page.publicPath}</loc>\n    <lastmod>${lastModified(page.source)}</lastmod>\n    <changefreq>${frequency}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
  })
  .join("\n")
await write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`,
)
await write(
  "robots.txt",
  `User-agent: *\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nUser-agent: ChatGPT-User\nAllow: /\n\nSitemap: ${baseUrl}sitemap.xml\n`,
)

const version = (await readFile(resolve(repoDir, "VERSION"), "utf8")).trim()
const documentationLinks = canonicalPages
  .map(
    (page) =>
      `- [${page.title}](${baseUrl}${page.publicPath}): ${page.description}`,
  )
  .join("\n")
const llmIndex = `# kmsg

> kmsg is an unofficial KakaoTalk CLI and native MCP server for macOS. It reads, watches, and sends messages through Apple's Accessibility API for local automation and AI agents.

Current version: ${version}
Canonical website: ${baseUrl}
Source repository: ${repositoryUrl}
License: MIT

## Documentation

${documentationLinks}

## Primary facts

- Platform: macOS 13 or later
- Runtime dependency: KakaoTalk for macOS
- Implementation: Swift 6
- Interface: CLI, structured JSON, hooks, and native stdio MCP server
- Access method: macOS Accessibility API; kmsg does not implement the private LOCO protocol
- Install: \`brew install channprj/tap/kmsg\`
- Affiliation: Independent open source; not affiliated with Kakao Corp.

## Optional

- [Full Markdown corpus](${baseUrl}llms-full.txt): Project documentation combined as plain Markdown
`
await Promise.all([write("llm.txt", llmIndex), write("llms.txt", llmIndex)])

const sourcePaths = [
  ...new Set(
    canonicalPages
      .filter(({ pageKey }) => !["privacy", "terms"].includes(pageKey))
      .map(({ source }) => source),
  ),
]
const fullCorpus = await Promise.all(
  sourcePaths.map(async (source) => `\n\n---\n\nSource: ${source}\n\n${await readFile(resolve(repoDir, source), "utf8")}`),
)
await write("llms-full.txt", `${llmIndex}${fullCorpus.join("")}\n`)

await write(
  "site.webmanifest",
  `${JSON.stringify(
    {
      name: "kmsg — KakaoTalk CLI for macOS",
      short_name: "kmsg",
      description: legacyContent.pages.find(
        ({ locale, pageKey }) => locale === "ko" && pageKey === "home",
      ).description,
      start_url: "/kmsg/",
      display: "standalone",
      background_color: "#11110f",
      theme_color: "#fee500",
      icons: [
        {
          src: "/kmsg/assets/brand/png/kmsg-app-icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/kmsg/assets/brand/png/kmsg-app-icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
      ],
    },
    null,
    2,
  )}\n`,
)
await write(".nojekyll", "")

console.log(
  `Built ${canonicalPages.length} React pages, redirects, and discovery files in site/dist`,
)
