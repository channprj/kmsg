import { execFileSync } from "node:child_process"
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { basename, dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import legacyContent from "../app/content/legacy-content.json" with { type: "json" }
import trustContent from "../app/content/trust-content.json" with { type: "json" }

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
const pageSlugs = {
  home: "",
  usage: "usage/",
  architecture: "architecture/",
  openclaw: "mcp/",
  skill: "skill/",
  versioning: "versioning/",
  developers: "developers/",
  about: "about/",
  contact: "contact/",
  privacy: "privacy/",
  terms: "terms/",
}

const canonicalPages = [...legacyContent.pages, ...trustContent.pages].map((page) => ({
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

async function write(relativePath, content) {
  const path = join(distDir, relativePath)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, content)
}

async function copyOutput(sourceRelativePath, targetRelativePath) {
  const target = join(distDir, targetRelativePath)
  await mkdir(dirname(target), { recursive: true })
  await cp(join(distDir, sourceRelativePath), target)
}

async function markdownFor(page) {
  if (page.pageKey === "privacy" || page.pageKey === "terms") {
    const copy = legacyContent.legalContent[page.locale][page.pageKey]
    const sections = copy.sections
      .map(({ title, body }) => `## ${title}\n\n${body}`)
      .join("\n\n")
    return `# ${copy.heading}\n\n> ${copy.intro}\n\n${sections}\n`
  }

  const markdown = await readFile(resolve(repoDir, page.source), "utf8")
  return markdown.endsWith("\n") ? markdown : `${markdown}\n`
}

await rm(distDir, { recursive: true, force: true })
await mkdir(distDir, { recursive: true })
await cp(prerenderDir, distDir, { recursive: true })
await mkdir(join(distDir, "assets"), { recursive: true })
await cp(join(clientDir, "assets"), join(distDir, "assets"), { recursive: true })
await Promise.all([
  cp(resolve(repoDir, "assets/kmsg-logo.jpg"), join(distDir, "assets/kmsg-logo.jpg")),
  cp(resolve(repoDir, "assets/demo1.mp4"), join(distDir, "assets/demo1.mp4")),
])

for (const page of canonicalPages.filter(({ locale }) => locale === "ko")) {
  const legacyPath = `ko/${pageSlugs[page.pageKey]}index.html`
  await copyOutput(`${page.publicPath}index.html`, legacyPath)
}

for (const locale of Object.keys(localePrefixes)) {
  const prefix = localePrefixes[locale]
  await copyOutput(`${prefix}mcp/index.html`, `${prefix}openclaw/index.html`)
  if (locale === "ko") {
    await copyOutput("mcp/index.html", "ko/openclaw/index.html")
  }
}

for (const page of canonicalPages) {
  await write(`${page.publicPath}index.md`, await markdownFor(page))
}

const localeLinks = Object.entries(localePrefixes)
  .map(
    ([locale, prefix]) =>
      `<a class="not-found-locale" href="${baseUrl}${prefix}">${locale.toUpperCase()} · ${legacyContent.locales[locale].name}</a>`,
  )
  .join("")
await write(
  "404.html",
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page not found - kmsg</title><meta name="robots" content="noindex,follow"><link rel="icon" href="/kmsg/assets/favicon.svg" type="image/svg+xml"><link rel="describedby" href="/kmsg/llms.txt"><style>html{color-scheme:dark;background:#11110f;color:#f7f7f2;font-family:system-ui,sans-serif}body{margin:0}.not-found-page{display:flex;min-height:100vh;box-sizing:border-box;flex-direction:column;justify-content:center;max-width:48rem;margin:auto;padding:2rem}.not-found-page img{border-radius:.75rem}.not-found-page h1{font-size:clamp(2.5rem,8vw,5rem);margin:.75rem 0}.not-found-page p{color:#aaa99f;line-height:1.7}.not-found-page nav{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:2rem}.not-found-locale{min-height:2.75rem;display:inline-flex;align-items:center;border:1px solid #35352e;border-radius:.75rem;padding:0 1rem;color:inherit;text-decoration:none}.not-found-locale:hover{background:#252520}.agent-recovery{margin:2rem 0 0;border:1px solid #35352e;border-radius:.75rem;background:#191915;padding:1rem;white-space:pre-wrap;color:#d8d7cf;line-height:1.6;overflow-wrap:anywhere}</style></head><body><main class="not-found-page"><img src="/kmsg/assets/kmsg-logo.jpg" alt="" width="64" height="64"><p>404</p><h1>Page not found</h1><p>The requested page does not exist. Choose a language to return to kmsg.</p><nav aria-label="Choose a kmsg homepage">${localeLinks}</nav><pre class="agent-recovery" data-agent-recovery># kmsg 404

The requested path does not exist. Continue with one of these resources:

- [Home](${baseUrl})
- [Agent index](${baseUrl}llms.txt)
- [Sitemap](${baseUrl}sitemap.xml)
- [MCP documentation](${baseUrl}mcp/)</pre></main></body></html>`,
)

const sitemapEntries = canonicalPages
  .map((page) => {
    const priority = page.pageKey === "home" ? "1.0" : "0.8"
    const frequency = page.pageKey === "home" ? "weekly" : "monthly"
    return `  <url>\n    <loc>${baseUrl}${page.publicPath}</loc>\n    <lastmod>${page.lastModified ?? lastModified(page.source)}</lastmod>\n    <changefreq>${frequency}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
  })
  .join("\n")
await write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`,
)
const agentUserAgents = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Google-Extended",
  "ora-agent",
  "DeepSeekBot",
]
const agentAllowRules = agentUserAgents
  .map((userAgent) => `User-agent: ${userAgent}\nAllow: /`)
  .join("\n\n")
await write(
  "robots.txt",
  `User-agent: *\nAllow: /\n\n${agentAllowRules}\n\nSitemap: ${baseUrl}sitemap.xml\n`,
)

const version = (await readFile(resolve(repoDir, "VERSION"), "utf8")).trim()
const documentationLinks = canonicalPages
  .map(
    (page) =>
      `- [${page.title}](${baseUrl}${page.publicPath}index.md): ${page.description}`,
  )
  .join("\n")
const llmIndex = `# kmsg

> kmsg is an unofficial KakaoTalk CLI and native MCP server for macOS. It reads, watches, and sends messages through Apple's Accessibility API for local automation and AI agents.

Current version: ${version}
Canonical website: ${baseUrl}
Source repository: ${repositoryUrl}
License: MIT

## When to use kmsg

- [Read and watch KakaoTalk with kmsg](${baseUrl}usage/index.md): Use kmsg when an agent or local automation needs to list chats, read recent messages, watch for new messages, or produce structured JSON on a Mac where KakaoTalk is installed.
- [Preview and send KakaoTalk messages with kmsg](${baseUrl}usage/index.md): Use kmsg for user-approved text or image sends through the visible KakaoTalk UI; preview the target and payload with \`--dry-run\` before a real send.
- [Use the kmsg MCP server](${baseUrl}mcp/index.md): Use the native stdio MCP server when Claude, ChatGPT, Codex, or another MCP client should call kmsg read and send tools locally.
- [Install the kmsg coding-agent Skill](${baseUrl}skill/index.md): Use the Skill when a coding agent needs a repeatable safety-first workflow for checking status, resolving chat identities, reading, and sending.

## Developer resources

- [kmsg developer portal](${baseUrl}developers/index.md): First-party integration map for CLI and JSON, authentication, MCP, events, HTTP API status, webhooks, source, and safety boundaries.
- [kmsg API and CLI reference](${baseUrl}usage/index.md): Command syntax, structured JSON output, environment variables, installation, troubleshooting, and local automation contracts.
- [kmsg authentication docs](${baseUrl}developers/index.md): KakaoTalk desktop login, encrypted local credential storage, lock-mode behavior, and the absence of hosted OAuth or bearer-token authentication.
- [kmsg MCP server](${baseUrl}mcp/index.md): Native stdio MCP transport, tool names, client configuration, confirmation behavior, and operating constraints.
- [kmsg webhooks and event integration status](${baseUrl}developers/index.md): Local \`watch --json\` events, the absence of a hosted webhook service, and the operator-owned supervisor pattern.

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
          src: "/kmsg/assets/kmsg-logo.jpg",
          sizes: "1000x1000",
          type: "image/jpeg",
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
