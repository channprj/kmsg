import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const siteDir = resolve(fileURLToPath(new URL("..", import.meta.url)));
const distDir = join(siteDir, "dist");
const readOutput = (path) => readFile(join(distDir, path), "utf8");

const locales = {
  ko: { prefix: "", lang: "ko", hrefLang: "ko" },
  en: { prefix: "en/", lang: "en", hrefLang: "en" },
  jp: { prefix: "jp/", lang: "ja", hrefLang: "ja" },
  cn: { prefix: "cn/", lang: "zh-CN", hrefLang: "zh-CN" },
};
const pages = {
  home: "",
  usage: "usage/",
  architecture: "architecture/",
  openclaw: "mcp/",
  skill: "skill/",
  versioning: "versioning/",
};

const localizedPath = (localeId, pageKey) =>
  `${locales[localeId].prefix}${pages[pageKey]}index.html`;
const publicUrl = (localeId, pageKey) =>
  `https://channprj.github.io/kmsg/${locales[localeId].prefix}${pages[pageKey]}`;

const contentFiles = Object.keys(locales).flatMap((localeId) =>
  Object.keys(pages).map((pageKey) => localizedPath(localeId, pageKey)),
);

const expectedFiles = [
  ...contentFiles,
  "ko/index.html",
  "ko/usage/index.html",
  "ko/architecture/index.html",
  "ko/openclaw/index.html",
  "ko/mcp/index.html",
  "ko/skill/index.html",
  "ko/versioning/index.html",
  "openclaw/index.html",
  "en/openclaw/index.html",
  "jp/openclaw/index.html",
  "cn/openclaw/index.html",
  "assets/styles.css",
  "assets/app.js",
  "assets/favicon.svg",
  "assets/kmsg-logo.jpg",
  "assets/kmsg-workspace.webp",
  "assets/demo1.mp4",
  "assets/demo-captions.vtt",
  "robots.txt",
  "sitemap.xml",
  "llm.txt",
  "llms.txt",
  "llms-full.txt",
  "site.webmanifest",
  ".nojekyll",
];

test("build emits every localized page and discovery artifact", async () => {
  await Promise.all(expectedFiles.map((path) => access(join(distDir, path))));
});

test("Korean is canonical at root and on every default documentation route", async () => {
  const sources = {
    home: "README.md",
    usage: "site/content/ko/usage.md",
    architecture: "site/content/ko/architecture.md",
    openclaw: "site/content/ko/openclaw.md",
    skill: "site/content/ko/skill.md",
    versioning: "site/content/ko/versioning.md",
  };
  const visibleCopy = {
    home: "하게 사용하세요\\.",
    usage: "kmsg 사용법",
    architecture: "kmsg 아키텍처",
    openclaw: "OpenClaw 연동 가이드",
    skill: "kmsg 코딩 에이전트 Skill",
    versioning: "kmsg 버전 관리",
  };

  for (const pageKey of Object.keys(pages)) {
    const html = await readOutput(localizedPath("ko", pageKey));
    assert.match(html, /<html lang="ko" data-locale="ko"/);
    assert.match(
      html,
      new RegExp(
        `<body class="is-${pageKey === "home" ? "home" : "docs"}" data-source="${sources[pageKey].replaceAll(".", "\\.")}" data-locale="ko"`,
      ),
    );
    assert.match(html, new RegExp(visibleCopy[pageKey]));
    assert.match(
      html,
      new RegExp(
        `<link rel="canonical" href="${publicUrl("ko", pageKey).replaceAll("/", "\\/")}">`,
      ),
    );
  }
});

test("all four locales render localized home and documentation content", async () => {
  const homeCopy = {
    ko: "하게 사용하세요\\.",
    en: "from your terminal\\.",
    jp: "KakaoTalkをターミナルから。",
    cn: "在终端中使用KakaoTalk。",
  };
  const usageCopy = {
    ko: "안전한 읽기",
    en: "Background-safe read fails",
    jp: "安全な読み取り",
    cn: "安全读取",
  };
  const storyCopy = {
    ko: "헤르메스 에이전트 5개로 뉴스 큐레이션부터 주식 매매까지 자동화한 방법",
    en: "How five Hermes agents automate news curation and stock trading",
    jp: "5つのHermesエージェントでニュース収集から株式取引まで自動化",
    cn: "用5个Hermes智能体自动完成新闻整理与股票交易",
  };

  for (const [localeId, locale] of Object.entries(locales)) {
    const [home, usage] = await Promise.all([
      readOutput(localizedPath(localeId, "home")),
      readOutput(localizedPath(localeId, "usage")),
    ]);
    assert.match(
      home,
      new RegExp(`<html lang="${locale.lang}" data-locale="${localeId}"`),
    );
    assert.match(home, new RegExp(homeCopy[localeId]));
    assert.ok(home.includes(storyCopy[localeId]));
    assert.match(usage, new RegExp(usageCopy[localeId]));
    assert.match(usage, /--dry-run/);
    assert.match(usage, /confirm=true/);
    assert.equal((home.match(/<h1(?:\s|>)/g) || []).length, 1);
    assert.equal((usage.match(/<h1(?:\s|>)/g) || []).length, 1);
  }
});

test("Korean home renders the requested two-line AI Native headline", async () => {
  const html = await readOutput(localizedPath("ko", "home"));

  assert.match(
    html,
    /<h1 id="hero-title">\s*<span class="hero-title-line">카카오톡을<\/span>\s*<span class="hero-title-line"><mark class="hero-highlight">AI Native<\/mark> 하게 사용하세요\.<\/span>\s*<\/h1>/,
  );
});

test("AI Native headline remains legible in both site themes", async () => {
  const styles = await readOutput("assets/styles.css");

  assert.match(
    styles,
    /\.product-hero \.hero-highlight\s*\{[^}]*background:\s*transparent;[^}]*color:\s*var\(--accent-text\);[^}]*\}/s,
  );
});

test("hero headline carries the themed text gradient", async () => {
  const styles = await readOutput("assets/styles.css");

  assert.match(
    styles,
    /\.product-hero h1\s*\{[^}]*background-image:\s*linear-gradient\(90deg, #ffffff 0%, #9b9b9b 100%\);[^}]*background-clip:\s*text;/s,
  );
  assert.match(
    styles,
    /:root\[data-theme="paper"\] \.product-hero h1\s*\{[^}]*background-image:\s*linear-gradient\(90deg, #000000 0%, #666666 100%\);/s,
  );
  assert.match(
    styles,
    /\.product-hero h1 \.hero-highlight\s*\{[^}]*-webkit-text-fill-color:\s*var\(--accent-text\);/s,
  );
});

test("Korean headline keeps its second line compact on narrow screens", async () => {
  const styles = await readOutput("assets/styles.css");

  assert.match(
    styles,
    /html\[lang="ko"\] \.product-hero \.hero-title-line:last-child\s*\{[^}]*font-size:\s*0\.7em;[^}]*\}/s,
  );
});

test("home routes render the curated product page instead of README layout", async () => {
  const sectionIds = [
    "workflow",
    "principles",
    "capabilities",
    "agent-skill",
    "stories",
    "install",
  ];

  for (const localeId of Object.keys(locales)) {
    const html = await readOutput(localizedPath(localeId, "home"));

    assert.match(html, /<body class="is-home"/);
    assert.match(html, /<div class="product-home" data-product-home>/);
    for (const id of sectionIds) {
      assert.match(html, new RegExp(`<section[^>]+id="${id}"`));
    }
    assert.doesNotMatch(html, /class="content-layout"/);
    assert.doesNotMatch(html, /class="toc"/);
    assert.doesNotMatch(html, /data-markdown-content/);
    if (localeId !== "ko") {
      assert.doesNotMatch(
        html,
        /AI Native|AI-native way|AIネイティブ|AI原生方式/,
      );
    }
  }
});

test("rebuilt home ships original media and anti-default interaction choices", async () => {
  const [html, styles, app] = await Promise.all([
    readOutput(localizedPath("ko", "home")),
    readOutput("assets/styles.css"),
    readOutput("assets/app.js"),
  ]);

  assert.match(
    html,
    /<link rel="preload" as="image" href="\.\/assets\/kmsg-workspace\.webp"[^>]*>/,
  );
  assert.match(
    html,
    /<img src="\.\/assets\/kmsg-workspace\.webp"[^>]+width="1536" height="1024"/,
  );
  assert.match(
    html,
    /<div class="workflow-frame" role="img" aria-label="[^"]+">/,
  );
  assert.equal((html.match(/class="section-label"/g) || []).length, 1);
  assert.doesNotMatch(html, /brand-status|capability-index/);
  assert.doesNotMatch(styles, /fonts\.googleapis\.com/);
  assert.doesNotMatch(app, /addEventListener\("scroll"/);
  assert.match(styles, /Product surface rebuild:/);

  for (const path of contentFiles) {
    const page = await readOutput(path);
    assert.doesNotMatch(page, /[—–]/);
  }
});

test("curated home keeps product proof, stories, and install actions", async () => {
  for (const localeId of Object.keys(locales)) {
    const html = await readOutput(localizedPath(localeId, "home"));

    assert.match(html, /<header class="site-header" data-header>/);
    assert.doesNotMatch(html, /data-home-header/);
    assert.match(html, /kmsg chats --limit 2/);
    assert.match(html, /kmsg read &quot;/);
    assert.match(html, /kmsg send &quot;/);
    assert.equal(
      (html.match(/<article class="principle-card">/g) || []).length,
      3,
    );
    assert.equal(
      (html.match(/<article class="capability-row/g) || []).length,
      3,
    );
    assert.equal(
      (html.match(/<article class="story-card">/g) || []).length,
      2,
    );
    assert.match(html, /brew install channprj\/tap\/kmsg/);
    assert.match(html, /github\.com\/channprj\/kmsg\/releases/);
  }
});

test("home hero pairs its actions with a proof and risk reversal line", async () => {
  const heroProofLead = {
    ko: "MIT 오픈소스",
    en: "MIT open source",
    jp: "MITオープンソース",
    cn: "MIT开源",
  };
  const styles = await readOutput("assets/styles.css");

  for (const localeId of Object.keys(locales)) {
    const html = await readOutput(localizedPath(localeId, "home"));
    const proof = html.match(/<ul class="hero-proof">[\s\S]*?<\/ul>/)?.[0];

    assert.ok(proof, `${localeId}: missing hero proof line`);
    assert.equal((proof.match(/<li>/g) || []).length, 3, localeId);
    assert.ok(proof.includes(heroProofLead[localeId]), localeId);
    assert.match(proof, /dry-run/i);
  }

  assert.match(
    styles,
    /\.product-hero \.hero-copy > :nth-child\(6\)\s*\{[^}]*animation-delay:\s*260ms;/s,
  );
});

test("landing copy avoids orphaned words", async () => {
  const styles = await readOutput("assets/styles.css");

  assert.match(
    styles,
    /\.hero-lead,[\s\S]*?\.faq-item p\s*\{[^}]*text-wrap:\s*pretty;/s,
  );
  assert.match(
    styles,
    /\.principle-card h3,[\s\S]*?\.agent-skill-card h3\s*\{[^}]*text-wrap:\s*balance;/s,
  );
});

test("install panel walks through the three step setup path", async () => {
  const stepLead = {
    ko: "Homebrew로 kmsg 설치",
    en: "Install kmsg with Homebrew",
    jp: "Homebrewでkmsgをインストール",
    cn: "使用Homebrew安装kmsg",
  };

  for (const localeId of Object.keys(locales)) {
    const html = await readOutput(localizedPath(localeId, "home"));
    const steps = html.match(/<ol class="install-steps">[\s\S]*?<\/ol>/)?.[0];

    assert.ok(steps, `${localeId}: missing install steps`);
    assert.equal((steps.match(/<li>/g) || []).length, 3, localeId);
    assert.ok(steps.includes(stepLead[localeId]), localeId);
    assert.match(steps, /dry-run/i);
  }
});

test("home routes stage the tagline reveal word by word", async () => {
  const [styles, app] = await Promise.all([
    readOutput("assets/styles.css"),
    readOutput("assets/app.js"),
  ]);

  for (const localeId of Object.keys(locales)) {
    const html = await readOutput(localizedPath(localeId, "home"));
    const section = html.match(
      /<section class="product-section tagline-section" id="tagline" data-tagline[\s\S]*?<\/section>/,
    )?.[0];

    assert.ok(section, `${localeId}: missing tagline section`);
    assert.equal(
      (section.match(/class="tagline-line"/g) || []).length,
      2,
      localeId,
    );
    assert.ok(
      (section.match(/class="tagline-word"/g) || []).length >= 6,
      `${localeId}: expected word-level reveal spans`,
    );
  }

  assert.match(app, /data-tagline/);
  assert.doesNotMatch(app, /addEventListener\("scroll"/);
  assert.match(
    styles,
    /\.tagline-word\s*\{[^}]*transition:\s*color 700ms var\(--ease\);/s,
  );
  assert.match(
    styles,
    /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.tagline-armed \.tagline-word\s*\{[^}]*color:\s*var\(--ink\);/s,
  );
});

test("home routes document cross-agent skill installation and use", async () => {
  const localizedCopy = {
    ko: {
      title: "코딩 에이전트에서 바로 사용하세요.",
      prompt: "/kmsg 출시 준비 채팅방의 최근 메시지 10개를 요약해줘",
    },
    en: {
      title: "Use kmsg directly from your coding agent.",
      prompt: "/kmsg Summarize the 10 latest messages in Release Prep",
    },
    jp: {
      title: "コーディングエージェントからすぐに利用。",
      prompt: "/kmsg リリース準備の最新メッセージ10件を要約して",
    },
    cn: {
      title: "直接在编程智能体中使用kmsg。",
      prompt: "/kmsg 总结发布准备聊天中的最近10条消息",
    },
  };
  const installCommand =
    "npx skills add channprj/kmsg --skill kmsg --agent claude-code codex -g -y";

  for (const [localeId, copy] of Object.entries(localizedCopy)) {
    const html = await readOutput(localizedPath(localeId, "home"));

    assert.match(
      html,
      /<section class="product-section agent-skill-section" id="agent-skill" data-agent-skill>/,
    );
    assert.ok(html.includes(copy.title));
    assert.ok(html.includes(copy.prompt));
    assert.ok(html.includes(installCommand));
    assert.equal(
      (html.match(/<article class="agent-invocation">/g) || []).length,
      2,
    );
    assert.match(
      html,
      /<span>Claude Code<\/span>\s*<code translate="no">\/kmsg<\/code>/,
    );
    assert.match(
      html,
      /<span>Codex<\/span>\s*<code translate="no">\$kmsg<\/code>/,
    );
  }
});

test("home routes omit background-safe messaging", async () => {
  for (const localeId of Object.keys(locales)) {
    const html = await readOutput(localizedPath(localeId, "home"));

    assert.doesNotMatch(
      html,
      /background-safe|安全なバックグラウンド読み取り|安全后台读取/i,
    );
  }
});

test("usage routes explain the supported background-safe contract", async () => {
  const readCommandSource = await readFile(
    join(siteDir, "..", "Sources", "kmsg", "Commands", "ReadCommand.swift"),
    "utf8",
  );

  assert.match(
    readCommandSource,
    /@Flag\([\s\S]*?var backgroundSafe: Bool = false/,
  );

  for (const localeId of Object.keys(locales)) {
    const html = await readOutput(localizedPath(localeId, "usage"));

    assert.match(html, /v1\.260618\.0/);
    assert.match(html, /kmsg --version/);
    assert.match(html, /kmsg read --help/);
    assert.match(html, /brew upgrade kmsg/);
    assert.match(html, /background_safe: true/);
  }
});

test("home routes avoid decorative horizontal rules between sections", async () => {
  const styles = await readOutput("assets/styles.css");
  const productSectionRules = [
    ...styles.matchAll(/(?:^|\n)\.product-section\s*\{([^}]*)\}/g),
  ];

  assert.ok(productSectionRules.length > 0);
  assert.ok(
    productSectionRules.every(([, declarations]) =>
      !declarations.includes("border-top"),
    ),
  );

  for (const localeId of Object.keys(locales)) {
    const html = await readOutput(localizedPath(localeId, "home"));
    assert.doesNotMatch(html, /<hr(?:\s|>)/);
  }
});

test("home routes render valid localized watch commands", async () => {
  const watchCommands = {
    ko: "kmsg watch &quot;AI 프로젝트&quot; --json",
    en: "kmsg watch &quot;AI Project&quot; --json",
    jp: "kmsg watch &quot;AIプロジェクト&quot; --json",
    cn: "kmsg watch &quot;AI项目&quot; --json",
  };

  for (const localeId of Object.keys(locales)) {
    const html = await readOutput(localizedPath(localeId, "home"));

    assert.ok(html.includes(watchCommands[localeId]));
  }
});

test("Korean stories heading uses the requested two-line workflow message", async () => {
  const html = await readOutput(localizedPath("ko", "home"));

  assert.ok(
    html.includes(
      "<h2>실제 자동화 워크플로우에서<br>널리 사용되고 있습니다</h2>",
    ),
  );
});

test("Korean stories heading stays compact on narrow screens", async () => {
  const styles = await readOutput("assets/styles.css");

  assert.match(
    styles,
    /html\[lang="ko"\] \.stories-section \.section-heading h2\s*\{[^}]*font-size:\s*clamp\(30px,\s*8\.4vw,\s*34px\);[^}]*\}/s,
  );
});

test("documentation routes retain Markdown content and table of contents", async () => {
  for (const localeId of Object.keys(locales)) {
    for (const pageKey of [
      "usage",
      "architecture",
      "openclaw",
      "skill",
      "versioning",
    ]) {
      const html = await readOutput(localizedPath(localeId, pageKey));
      assert.match(html, /<body class="is-docs"/);
      assert.match(html, /class="content-layout"/);
      assert.match(html, /class="toc"/);
      assert.match(html, /data-markdown-content/);
    }
  }
});

test("every page exposes complete hreflang alternates", async () => {
  for (const localeId of Object.keys(locales)) {
    for (const pageKey of Object.keys(pages)) {
      const html = await readOutput(localizedPath(localeId, pageKey));
      for (const [alternateId, alternate] of Object.entries(locales)) {
        assert.match(
          html,
          new RegExp(
            `hreflang="${alternate.hrefLang}" href="${publicUrl(alternateId, pageKey).replaceAll("/", "\\/")}"`,
          ),
        );
      }
      assert.match(
        html,
        new RegExp(
          `hreflang="x-default" href="${publicUrl("ko", pageKey).replaceAll("/", "\\/")}"`,
        ),
      );
    }
  }
});

test("language selector keeps the same page in ko, en, jp, and cn", async () => {
  for (const localeId of Object.keys(locales)) {
    for (const pageKey of Object.keys(pages)) {
      const html = await readOutput(localizedPath(localeId, pageKey));
      assert.match(html, /<select[^>]+data-language-select>/);
      for (const alternateId of Object.keys(locales)) {
        assert.match(
          html,
          new RegExp(
            `<option value="[^"]+" data-locale="${alternateId}"${alternateId === localeId ? " selected" : ""}>`,
          ),
        );
      }
    }
  }

  const [root, app] = await Promise.all([
    readOutput("index.html"),
    readOutput("assets/app.js"),
  ]);
  assert.match(root, /localStorage\.getItem\("kmsg-locale"\)/);
  assert.match(root, /"jp":"https:\/\/channprj\.github\.io\/kmsg\/jp\/"/);
  assert.match(root, /"cn":"https:\/\/channprj\.github\.io\/kmsg\/cn\/"/);
  assert.match(root, /location\.replace\(localeTargets\[savedLocale]/);
  assert.match(app, /localStorage\.setItem\("kmsg-locale", locale\)/);
  assert.match(app, /window\.location\.assign\(selected\.value\)/);
});

test("legacy ko routes redirect to canonical Korean routes", async () => {
  for (const pageKey of Object.keys(pages)) {
    const legacyPath = `ko/${pages[pageKey]}index.html`;
    const html = await readOutput(legacyPath);
    const canonical = publicUrl("ko", pageKey);
    assert.match(
      html,
      new RegExp(
        `http-equiv="refresh" content="0; url=${canonical.replaceAll("/", "\\/")}"`,
      ),
    );
    assert.match(
      html,
      new RegExp(`rel="canonical" href="${canonical.replaceAll("/", "\\/")}"`),
    );
    assert.match(html, /name="robots" content="noindex,follow"/);
  }
});

test("system fonts keep prose local, readable, and code distinct", async () => {
  const [root, styles] = await Promise.all([
    readOutput("index.html"),
    readOutput("assets/styles.css"),
  ]);
  assert.doesNotMatch(root, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.match(styles, /--body:\s*-apple-system,\s*BlinkMacSystemFont/);
  assert.match(styles, /--mono:\s*"SFMono-Regular"/);
  assert.match(
    styles,
    /html\[lang="ko"\]\s*{[\s\S]*--body:\s*-apple-system/,
  );
  assert.match(styles, /body\s*{[\s\S]*word-break:\s*keep-all/);
  assert.match(
    styles,
    /code,[\s\S]*pre,[\s\S]*\.terminal-window,[\s\S]*{[\s\S]*word-break:\s*normal/,
  );
});

test("shared SVG icons replace character glyphs in interface controls", async () => {
  const [home, usage, app] = await Promise.all([
    readOutput("index.html"),
    readOutput("usage/index.html"),
    readOutput("assets/app.js"),
  ]);
  const rendered = `${home}\n${usage}`;
  const requiredIcons = [
    "arrow-right",
    "external-link",
    "copy",
    "check",
    "chevron-down",
    "plus",
    "minus",
    "search",
    "sun",
    "moon",
  ];

  for (const icon of requiredIcons) {
    assert.match(rendered, new RegExp(`data-icon="${icon}"`), icon);
  }
  assert.doesNotMatch(
    rendered,
    /<span[^>]*aria-hidden="true">(?:↗|→|⌄|⧉|\+)<\/span>/,
  );
  assert.match(
    rendered,
    /<svg class="ui-icon ui-icon-(?:16|18|20)"[^>]*aria-hidden="true"[^>]*viewBox="0 0 256 256"[^>]*fill="currentColor"/,
  );
  assert.doesNotMatch(app, /textContent = "✓"/);
  assert.match(app, /classList\.add\("is-copied"\)/);
});

test("semantic typography keeps interface text readable", async () => {
  const styles = await readOutput("assets/styles.css");
  const tokens = {
    "--text-xs": "12px",
    "--text-sm": "14px",
    "--text-md": "16px",
    "--text-lg": "18px",
    "--text-xl": "24px",
    "--heading-sm": "clamp(30px, 3vw, 40px)",
    "--heading-md": "clamp(44px, 5vw, 60px)",
    "--heading-lg": "clamp(52px, 5.8vw, 72px)",
  };

  for (const [token, value] of Object.entries(tokens)) {
    assert.ok(styles.includes(`${token}: ${value};`), token);
  }
  for (const selector of [
    ".primary-nav a",
    ".section-label",
    ".capability-index",
    ".agent-skill-step",
    ".story-publisher",
    ".docs-meta",
    ".toc-label",
    ".source-stamp",
    ".code-copy",
    ".markdown-body th",
    ".footer-brand span",
  ]) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const block = styles.match(new RegExp(`${escaped}[^\\{]*\\{([^}]*)\\}`))?.[1];
    assert.ok(block, selector);
    assert.doesNotMatch(block, /font-size:\s*(?:[0-9]|1[01])px;/);
  }
  assert.match(
    styles,
    /@media \(max-width:\s*350px\)[\s\S]*\.terminal-body\s*\{[^}]*font-size:\s*11px;/,
  );
  assert.match(
    styles,
    /\.product-hero \.hero-lead\s*\{[^}]*font-size:\s*var\(--text-lg\);/s,
  );
  assert.match(
    styles,
    /\.principle-card h3\s*\{[^}]*font-size:\s*var\(--text-xl\);/s,
  );
  assert.match(
    styles,
    /\.capability-copy h3\s*\{[^}]*font-size:\s*var\(--heading-sm\);/s,
  );
  assert.match(
    styles,
    /\.stories-section \.story-copy h3\s*\{[^}]*font-size:\s*var\(--text-xl\);/s,
  );
});

test("home workflow omits non-terminal chrome and visible release labels", async () => {
  const forbiddenCopy = {
    ko: ["실제 CLI 흐름", "AX 연결됨", "텍스트 · 표준 출력"],
    en: ["Real CLI workflow", "AX connected", "text · stdout"],
    jp: ["実際のCLIフロー", "AX接続済み", "テキスト · 標準出力"],
    cn: ["真实CLI流程", "AX已连接", "文本 · 标准输出"],
  };

  for (const [localeId, labels] of Object.entries(forbiddenCopy)) {
    const html = await readOutput(localizedPath(localeId, "home"));

    for (const label of labels) {
      assert.ok(!html.includes(label), `${localeId} still renders ${label}`);
    }

    assert.ok(!html.includes("kmsg · zsh"));
    assert.doesNotMatch(
      html,
      /class="(?:workflow-meta|hero-version|terminal-version|terminal-footer)"/,
    );
    assert.doesNotMatch(html, /data-replay-progress/);
    assert.doesNotMatch(
      html,
      /<(?:strong|span|a)[^>]*>v\d+\.\d+\.\d+<\/(?:strong|span|a)>/,
    );
  }
});

test("home hero renders the real localized chats-read-send transcript", async () => {
  const scenarios = {
    ko: {
      label:
        "kmsg로 채팅 목록을 확인하고 메시지를 읽은 뒤 답장을 보내는 터미널 미리보기",
      primaryChat: "AI 프로젝트",
      secondaryChat: "출시 준비",
      sender: "지나",
      incoming: "새 메시지를 확인해줘.",
      outgoing: "지금 확인할게요.",
      reply: "확인했어요.",
    },
    en: {
      label:
        "Terminal replay showing kmsg listing chats, reading messages, and sending a reply",
      primaryChat: "AI Project",
      secondaryChat: "Release Prep",
      sender: "Jina",
      incoming: "Please check the latest messages.",
      outgoing: "I will check them now.",
      reply: "I've checked them.",
    },
    jp: {
      label:
        "kmsgでチャット一覧を確認し、メッセージを読んで返信するターミナル",
      primaryChat: "AIプロジェクト",
      secondaryChat: "リリース準備",
      sender: "ジナ",
      incoming: "新着メッセージを確認して。",
      outgoing: "今確認します。",
      reply: "確認しました。",
    },
    cn: {
      label: "使用kmsg查看聊天列表、读取消息并发送回复的终端演示",
      primaryChat: "AI项目",
      secondaryChat: "发布准备",
      sender: "Jina",
      incoming: "请确认最新消息。",
      outgoing: "我现在确认。",
      reply: "已经确认。",
    },
  };

  for (const [localeId, scenario] of Object.entries(scenarios)) {
    const html = await readOutput(localizedPath(localeId, "home"));
    const encodedReply = scenario.reply.replaceAll("'", "&#039;");
    const commands = [
      "kmsg chats --limit 2",
      `kmsg read &quot;${scenario.primaryChat}&quot; --limit 2 --keep-window`,
      `kmsg send &quot;${scenario.primaryChat}&quot; &quot;${encodedReply}&quot;`,
    ];
    const commandPositions = commands.map((command) => html.indexOf(command));

    assert.match(html, /data-terminal-replay/);
    assert.match(html, /<section class="product-workflow"[^>]*data-replay-scope/);
    assert.match(
      html,
      /class="terminal-transcript" data-replay-transcript data-replay-viewport/,
    );
    assert.doesNotMatch(
      html,
      /class="terminal-body"[^>]*data-replay-viewport/,
    );
    assert.doesNotMatch(html, /data-replay-progress/);
    assert.ok(html.includes(`aria-label="${scenario.label}"`));
    assert.ok(commandPositions.every((position) => position >= 0));
    assert.ok(
      commandPositions[0] < commandPositions[1] &&
        commandPositions[1] < commandPositions[2],
    );
    assert.match(html, new RegExp(scenario.secondaryChat));
    assert.match(html, new RegExp(scenario.sender));
    assert.match(
      html,
      new RegExp(scenario.incoming.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
    assert.match(
      html,
      new RegExp(scenario.outgoing.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
    assert.ok(html.includes(encodedReply));
    assert.match(html, /Looking for chat with/);
    assert.match(html, /Found existing chat window\./);
    assert.match(html, /✓ Message sent to/);
    assert.match(html, /✓ Chat window closed\./);
    assert.doesNotMatch(
      html,
      /class="terminal-line terminal-output-line[^"]*"[^>]*>\s*\n/,
    );
    assert.doesNotMatch(
      html,
      /data-replay-command>kmsg watch|class="tui-|MCP · kmsg_read/,
    );
  }
});

test("terminal replay is cancellable, motion-aware, and locale-safe", async () => {
  const [app, styles] = await Promise.all([
    readOutput("assets/app.js"),
    readOutput("assets/styles.css"),
  ]);

  assert.match(app, /class TerminalReplay/);
  assert.match(app, /Array\.from\(fullText\)/);
  assert.match(app, /new AbortController\(\)/);
  assert.match(app, /IntersectionObserver/);
  assert.match(app, /visibilitychange/);
  assert.match(app, /prefers-reduced-motion: reduce/);
  assert.match(app, /scrollTo\(/);
  assert.match(app, /showComplete\(\)/);
  assert.doesNotMatch(app, /data-replay-progress|this\.progress/);

  assert.match(
    styles,
    /\.terminal-transcript\s*{[\s\S]*overflow-y:\s*auto/,
  );
  assert.match(
    styles,
    /\.terminal-line\s*{[\s\S]*min-width:\s*0;[\s\S]*overflow-wrap:\s*anywhere;[\s\S]*white-space:\s*pre-wrap/,
  );
  assert.match(
    styles,
    /\.terminal-command\s*{[\s\S]*min-width:\s*0/,
  );
  assert.match(styles, /\.workflow-frame\s*{[\s\S]*min-width:\s*0/);
  assert.match(
    styles,
    /\.terminal-window\.is-replaying[\s\S]*\.terminal-line\.is-visible/,
  );
  assert.match(
    styles,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation-duration:\s*0\.01ms !important/,
  );
  assert.doesNotMatch(
    styles,
    /\.tui-(?:workspace|rail|stream|event|tool-call|ready)/,
  );
});

test("copy controls fall back when the Clipboard API rejects", async () => {
  const app = await readOutput("assets/app.js");

  assert.match(
    app,
    /if \(navigator\.clipboard\?\.writeText\)\s*{\s*try\s*{\s*await navigator\.clipboard\.writeText\(value\);\s*return;\s*} catch \{/s,
  );
  assert.match(
    app,
    /let copied = false;[\s\S]*copied = document\.execCommand\("copy"\);[\s\S]*finally\s*{[\s\S]*area\.remove\(\)/,
  );
  assert.match(app, /if \(!copied\) throw new Error\("Copy failed"\)/);
});

test("home workflow uses the compact Ghostty visual contract", async () => {
  const styles = await readOutput("assets/styles.css");

  assert.match(
    styles,
    /\.terminal-window\s*{[\s\S]*border-radius:\s*var\(--radius-md\);[\s\S]*background:\s*#282c34;[\s\S]*color:\s*#ffffff;/,
  );
  assert.match(
    styles,
    /\.terminal-bar\s*{[\s\S]*height:\s*36px;[\s\S]*background:\s*#282c34;/,
  );
  assert.match(
    styles,
    /\.traffic-lights i\s*{[\s\S]*width:\s*10px;[\s\S]*height:\s*10px/,
  );
  assert.match(
    styles,
    /\.terminal-body\s*{[\s\S]*background:\s*#282c34;[\s\S]*font-family:\s*"JetBrains Mono"[\s\S]*font-size:\s*13px;[\s\S]*line-height:\s*1\.2;/,
  );
  assert.match(
    styles,
    /\.terminal-transcript\s*{[\s\S]*padding:\s*10px 12px 12px;/,
  );
  assert.match(
    styles,
    /\.terminal-command-line\s*{[\s\S]*margin-top:\s*3px;[\s\S]*gap:\s*8px;/,
  );
  assert.match(
    styles,
    /\.terminal-output-gap\s*{[\s\S]*height:\s*1px;/,
  );
  assert.match(
    styles,
    /\.terminal-muted\s*{[\s\S]*color:\s*#9399a5;/,
  );
  assert.match(
    styles,
    /\.workflow-frame\s*{[\s\S]*padding:\s*0;[\s\S]*border:\s*0;[\s\S]*background:\s*transparent;[\s\S]*box-shadow:\s*none;/,
  );
  assert.match(
    styles,
    /@media \(max-width:\s*760px\)[\s\S]*\.terminal-body\s*{[\s\S]*font-size:\s*12px;/,
  );
  assert.match(
    styles,
    /@media \(max-width:\s*350px\)[\s\S]*\.terminal-body\s*{[\s\S]*font-size:\s*11px;/,
  );
  assert.doesNotMatch(
    styles,
    /\.terminal-(?:footer|version)|\.workflow-meta|@keyframes terminal-scan|\.terminal-window::after|\.hero-visual:hover \.terminal-window/,
  );
});

test("homepage replay uses shell prompts and relaxed terminal rhythm", async () => {
  const [html, styles] = await Promise.all([
    readOutput("index.html"),
    readOutput("assets/styles.css"),
  ]);
  assert.doesNotMatch(html, /❯/);
  assert.ok(
    (html.match(/class="terminal-prompt">\$<\/span>/g) || []).length >= 4,
  );
  assert.match(styles, /\.terminal-body\s*{[^}]*line-height:\s*1\.2;/s);
});

test("homepage left-aligns hero actions and varies story geometry", async () => {
  const styles = await readOutput("assets/styles.css");
  assert.match(
    styles,
    /\.product-hero \.hero-actions\s*{[^}]*justify-content:\s*flex-start;/s,
  );
  assert.match(
    styles,
    /\.stories-section \.story-grid\s*{[^}]*grid-template-columns:\s*1\.08fr 0\.92fr;/s,
  );
  assert.match(
    styles,
    /\.stories-section \.story-media\s*{[^}]*overflow:\s*hidden;[^}]*aspect-ratio:\s*16\s*\/\s*10;/s,
  );
  assert.match(
    styles,
    /\.stories-section \.story-card:nth-child\(2\) \.story-media\s*{[^}]*aspect-ratio:\s*16\s*\/\s*12;/s,
  );
});

test("story discovery searches every requested Korean phrase", async () => {
  const expectedUrl =
    "https://www.google.com/search?q=%22kmsg+%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%86%A1%22+OR+%22kmsg+%EC%B9%B4%ED%86%A1%22+OR+%22kmsg+%EC%B9%B4%EC%B9%B4%EC%98%A4%22";
  const expectedTerms = [
    "kmsg 카카오톡",
    "kmsg 카톡",
    "kmsg 카카오",
  ];

  for (const localeId of Object.keys(locales)) {
    const html = await readOutput(localizedPath(localeId, "home"));
    const panel = html.match(
      /<a class="story-search-action"[\s\S]*?<\/a>/,
    )?.[0];

    assert.ok(panel, `${localeId}: missing story search panel`);
    assert.ok(panel.includes(`href="${expectedUrl}"`), localeId);
    assert.match(panel, /target="_blank" rel="noopener noreferrer"/);
    assert.match(panel, /data-icon="search"/);
    assert.match(panel, /data-icon="external-link"/);
    for (const term of expectedTerms) {
      assert.ok(
        panel.includes(`<span class="story-search-term">${term}</span>`),
        `${localeId}: ${term}`,
      );
    }
  }
});

test("homepage renders every FAQ represented by structured data", async () => {
  for (const localeId of Object.keys(locales)) {
    const html = await readOutput(localizedPath(localeId, "home"));
    const data = JSON.parse(
      html.match(
        /<script type="application\/ld\+json">([\s\S]+?)<\/script>/,
      )[1],
    );
    const faq = data["@graph"].find((node) => node["@type"] === "FAQPage");
    assert.match(
      html,
      /<section class="product-section faq-section" id="faq">/,
    );
    assert.equal(
      (html.match(/<details class="faq-item">/g) || []).length,
      faq.mainEntity.length,
      localeId,
    );
    for (const item of faq.mainEntity) {
      assert.ok(html.includes(item.name), `${localeId}: ${item.name}`);
      assert.ok(
        html.includes(item.acceptedAnswer.text),
        `${localeId}: ${item.acceptedAnswer.text}`,
      );
    }
  }
});

test("documentation code blocks use the same terminal color family", async () => {
  const styles = await readOutput("assets/styles.css");
  assert.match(
    styles,
    /\.markdown-body pre\s*{[^}]*background:\s*#282c34;/s,
  );
  assert.match(
    styles,
    /\.markdown-body pre::before\s*{[^}]*#282c34;[^}]*content:\s*"";/s,
  );
});

test("every content page uses the shared shell and localized navigation", async () => {
  for (const path of contentFiles) {
    const html = await readOutput(path);
    assert.match(
      html,
      /<div class="site-shell">[\s\S]*<header[\s\S]*<main[\s\S]*<footer[\s\S]*<\/div>/,
    );
    assert.match(
      html,
      /class="footer-llm-link"[^>]+href="[^"]*llm\.txt"/,
    );
    assert.doesNotMatch(html, /class="llm-link"/);
    assert.match(html, /class="language-control"/);
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
    assert.doesNotMatch(html, /href="(?:\.\/|\.\.\/)[^"]+\.md(?:#|")/);
    assert.doesNotMatch(html, /javascript:/i);
  }
});

test("every canonical page exposes the same ordered primary navigation", async () => {
  const localizedLabels = {
    ko: ["사용법", "구조", "MCP", "Skill", "GitHub"],
    en: ["Usage", "Architecture", "MCP", "Skill", "GitHub"],
    jp: ["使い方", "構成", "MCP", "Skill", "GitHub"],
    cn: ["使用指南", "架构", "MCP", "Skill", "GitHub"],
  };

  for (const localeId of Object.keys(locales)) {
    for (const pageKey of Object.keys(pages)) {
      const path = localizedPath(localeId, pageKey);
      const html = await readOutput(path);
      assert.match(
        html,
        /<nav class="primary-nav"[^>]*tabindex="0"[^>]*>/,
        path,
      );
      const nav = html.match(
        /<nav class="primary-nav"[^>]*>([\s\S]*?)<\/nav>/,
      )?.[1];
      assert.ok(nav, `missing primary navigation in ${path}`);
      const labels = [...nav.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/g)].map(
        ([, value]) =>
          value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
      );
      assert.deepEqual(
        labels.map((label) => label.replace(/\s*↗$/, "")),
        localizedLabels[localeId],
        path,
      );
      assert.equal(
        (nav.match(/aria-current="page"/g) || []).length,
        pageKey === "home" || pageKey === "versioning" ? 0 : 1,
        path,
      );
    }
  }
});

test("legacy OpenClaw routes redirect to localized canonical MCP routes", async () => {
  for (const [localeId, locale] of Object.entries(locales)) {
    const legacy = `${locale.prefix}openclaw/index.html`;
    const html = await readOutput(legacy);
    const canonical = publicUrl(localeId, "openclaw");
    assert.match(html, new RegExp(`url=${canonical.replaceAll("/", "\\/")}`));
    assert.match(
      html,
      new RegExp(
        `rel="canonical" href="${canonical.replaceAll("/", "\\/")}"`,
      ),
    );
    assert.match(html, /name="robots" content="noindex,follow"/);
  }

  for (const path of contentFiles) {
    const html = await readOutput(path);
    const publicSiteLinks = [...html.matchAll(/href="([^"]+)"/g)]
      .map(([, href]) => href)
      .filter((href) => !href.startsWith("https://github.com/"));
    assert.equal(
      publicSiteLinks.some((href) => /(?:^|\/)openclaw\/(?:$|[#?])/.test(href)),
      false,
      path,
    );
  }
});

test("Korean homepage retains both real-world stories and install target", async () => {
  const html = await readOutput("index.html");
  assert.match(html, /실사용 후기/);
  assert.match(html, /_Pd1G33_R48\/maxresdefault\.jpg/);
  assert.match(html, /xz5fA7OyvQ0\/maxresdefault\.jpg/);
  assert.equal((html.match(/<article class="story-card">/g) || []).length, 2);
  assert.match(html, /href="#install"/);
  assert.match(html, /id="install"/);
  assert.doesNotMatch(html, /<track kind="captions"/);
});

test("editorial homepage uses deliberate hierarchy and distinct rhythms", async () => {
  const styles = await readOutput("assets/styles.css");

  assert.match(
    styles,
    /\.product-hero\s*{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(12,\s*minmax\(0,\s*1fr\)\);/s,
  );
  assert.match(
    styles,
    /\.section-heading\s*{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(120px,\s*0\.32fr\)\s+minmax\(0,\s*1fr\);/s,
  );
  assert.match(
    styles,
    /\.section-heading h2,[\s\S]*?\.install-panel h2\s*{[^}]*text-wrap:\s*balance;/s,
  );
  assert.match(
    styles,
    /\.principle-card\s*{[^}]*border:\s*1px solid var\(--line\);/s,
  );
  assert.match(
    styles,
    /\.principle-card\s*{[^}]*border-radius:\s*var\(--radius-md\);/s,
  );
  assert.match(
    styles,
    /\.agent-skill-grid\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*0\.9fr\)\s+minmax\(0,\s*1\.1fr\);/s,
  );
  assert.match(
    styles,
    /@media \(max-width:\s*759px\)[\s\S]*?\.product-hero\s*{[^}]*grid-template-columns:\s*1fr;[^}]*\}[\s\S]*?\.section-heading\s*{[^}]*grid-template-columns:\s*1fr;[^}]*\}[\s\S]*?\.stories-section \.story-grid\s*{[^}]*grid-template-columns:\s*1fr;/s,
  );
  assert.match(
    styles,
    /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*animation-duration:\s*0\.01ms !important/,
  );
});

test("home and docs share the cohesive geometry system", async () => {
  const styles = await readOutput("assets/styles.css");

  for (const declaration of [
    "--radius-sm: 8px;",
    "--radius-md: 12px;",
    "--radius-lg: 16px;",
  ]) {
    assert.ok(styles.includes(declaration), declaration);
  }
  assert.match(
    styles,
    /\.header-inner\s*\{[^}]*min-height:\s*64px;/s,
  );
  assert.match(
    styles,
    /\.product-section\s*\{[^}]*padding:\s*80px 0;/s,
  );
  assert.match(
    styles,
    /\.docs-hero h1\s*\{[^}]*font-size:\s*var\(--heading-md\);/s,
  );
  assert.match(
    styles,
    /\.content-layout\s*\{[^}]*padding:\s*80px 0;/s,
  );
  assert.match(
    styles,
    /\.principle-card\s*\{[^}]*border:\s*1px solid var\(--line\);[^}]*border-radius:\s*var\(--radius-md\);/s,
  );
  assert.match(
    styles,
    /@media \(max-width:\s*759px\)[\s\S]*\.product-section\s*\{[^}]*padding:\s*64px 0;/s,
  );
});

test("home interface metadata follows the installed web design guidelines", async () => {
  const [html, usage, styles, app] = await Promise.all([
    readOutput("index.html"),
    readOutput("usage/index.html"),
    readOutput("assets/styles.css"),
    readOutput("assets/app.js"),
  ]);

  assert.match(
    html,
    /<a class="brand"[^>]*translate="no"[^>]*>[\s\S]*?<img[^>]*width="32"[^>]*height="32"/,
  );
  assert.match(
    html,
    /<div class="product-mark">[\s\S]*?<img[^>]*width="64"[^>]*height="64"[^>]*fetchpriority="high"[^>]*decoding="async"/,
  );
  assert.match(
    html,
    /<div class="terminal-window"[^>]*translate="no"/,
  );
  assert.match(
    html,
    /<button class="agent-skill-command copy-control"[^>]*aria-label="[^"]+"[^>]*aria-live="polite"[^>]*translate="no"/,
  );
  assert.match(
    html,
    /<button class="install-command copy-control"[^>]*aria-label="[^"]+"[^>]*aria-live="polite"[^>]*translate="no"/,
  );
  assert.match(
    html,
    /<footer[\s\S]*?<img[^>]*width="56"[^>]*height="56"[^>]*loading="lazy"[^>]*decoding="async"/,
  );
  assert.match(html, /<meta name="theme-color" content="#0c0d0b">/);
  assert.match(
    styles,
    /button,\s*a,\s*select\s*{[^}]*touch-action:\s*manipulation;/s,
  );
  assert.match(
    styles,
    /\.language-control select\s*{[^}]*background-color:\s*var\(--canvas-raised\);[^}]*color:\s*var\(--ink-muted\);/s,
  );
  assert.match(
    styles,
    /\.language-control select:focus-visible\s*{[^}]*outline:\s*2px solid var\(--accent-text\);/s,
  );
  assert.match(
    styles,
    /\.skip-link\s*{[^}]*transform:\s*translateY\(calc\(-100% - 20px\)\);/s,
  );
  assert.match(
    usage,
    /<button class="code-copy copy-control"[^>]*aria-live="polite"[^>]*data-code-copy/,
  );
  assert.match(
    app,
    /themeColor\?\.setAttribute\("content", theme === "paper" \? "#f2f2ed" : "#0c0d0b"\)/,
  );
});

test("home command copy buttons include their visible command in the accessible name", async () => {
  for (const localeId of Object.keys(locales)) {
    const html = await readOutput(localizedPath(localeId, "home"));

    assert.match(
      html,
      /<button class="agent-skill-command copy-control"[^>]*aria-label="[^"]*npx skills add channprj\/kmsg --skill kmsg --agent claude-code codex -g -y"/,
    );
    assert.match(
      html,
      /<button class="install-command copy-control"[^>]*aria-label="[^"]*brew install channprj\/tap\/kmsg"/,
    );
  }
});

test("curated home styles define the responsive product system", async () => {
  const styles = await readOutput("assets/styles.css");

  assert.match(styles, /--page:\s*min\(1120px,\s*calc\(100% - 48px\)\)/);
  assert.doesNotMatch(styles, /\.is-home \.site-header\s*\{/);
  assert.doesNotMatch(
    styles,
    /\.primary-nav\s*\{[^}]*display:\s*none;/s,
  );
  assert.match(
    styles,
    /@media \(max-width:\s*1060px\)[\s\S]*?\.primary-nav\s*\{[^}]*overflow-x:\s*auto;/s,
  );
  assert.match(
    styles,
    /\.principle-grid\s*{[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/,
  );
  assert.match(
    styles,
    /@media \(max-width:\s*759px\)[\s\S]*\.principle-grid,[\s\S]*\.story-grid\s*{[\s\S]*grid-template-columns:\s*1fr/,
  );
  assert.match(
    styles,
    /\.command-panel\s*{[\s\S]*overflow-x:\s*auto/,
  );
  assert.match(
    styles,
    /\.agent-skill-grid\s*{[\s\S]*grid-template-columns:\s*minmax\(0,\s*0\.9fr\)\s+minmax\(0,\s*1\.1fr\)/,
  );
  assert.match(
    styles,
    /\.agent-skill-command code\s*{[\s\S]*overflow-wrap:\s*anywhere/,
  );
  assert.match(
    styles,
    /@media \(max-width:\s*759px\)[\s\S]*\.agent-skill-grid\s*{[\s\S]*grid-template-columns:\s*1fr/,
  );
  assert.match(
    styles,
    /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*animation-duration:\s*0\.01ms !important/,
  );
});

test("home and docs share mobile-safe header control geometry", async () => {
  const styles = await readOutput("assets/styles.css");

  assert.match(
    styles,
    /@media \(max-width:\s*760px\)[\s\S]*?\.language-control\s*\{[^}]*height:\s*44px;/s,
  );
  assert.match(
    styles,
    /@media \(max-width:\s*760px\)[\s\S]*?\.theme-toggle\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;/s,
  );
  assert.match(
    styles,
    /@media \(max-width:\s*760px\)[\s\S]*?\.primary-nav a\s*\{[^}]*min-height:\s*44px;/s,
  );
  assert.doesNotMatch(
    styles,
    /\.is-home \.(?:site-header|header-inner|brand|primary-nav|header-tools|language-control|theme-toggle|home-github)/,
  );
});

test("documentation source metadata stays inside 320px viewports", async () => {
  const styles = await readOutput("assets/styles.css");

  assert.match(
    styles,
    /@media \(max-width:\s*760px\)[\s\S]*?\.source-stamp\s*\{[^}]*max-width:\s*100%;[^}]*flex-wrap:\s*wrap;[^}]*overflow-wrap:\s*anywhere;/s,
  );
  assert.match(
    styles,
    /@media \(max-width:\s*760px\)[\s\S]*?\.toc-source\s*\{[^}]*display:\s*none !important;/s,
  );
});

test("homepage secondary text and requirements remain accessible", async () => {
  const [html, styles] = await Promise.all([
    readOutput("index.html"),
    readOutput("assets/styles.css"),
  ]);

  assert.match(styles, /--ink-faint:\s*#8c8b84;/);
  assert.match(
    styles,
    /\.command-panel figcaption\s*\{[^}]*color:\s*#9a9b92;/s,
  );
  assert.match(styles, /\.code-copy\s*\{[^}]*color:\s*#96a1ac;/s);
  assert.match(
    html,
    /<ul class="requirement-list" aria-label="[^"]+">\s*<li>macOS 13\+<\/li>/,
  );
  assert.doesNotMatch(html, /<div class="requirement-list" aria-label=/);
});

test("wide Markdown tables remain keyboard-scrollable in every locale", async () => {
  const styles = await readOutput("assets/styles.css");
  for (const localeId of Object.keys(locales)) {
    const html = await readOutput(localizedPath(localeId, "architecture"));
    assert.match(
      html,
      /<div class="table-scroll" tabindex="0" role="region" aria-label="[^"]+"><table>/,
    );
  }
  assert.match(styles, /\.table-scroll\s*{[\s\S]*overflow-x:\s*auto/);
});

test("structured data describes all supported languages and Korean FAQ", async () => {
  const html = await readOutput("index.html");
  const match = html.match(
    /<script type="application\/ld\+json">([\s\S]+?)<\/script>/,
  );
  assert.ok(match);

  const data = JSON.parse(match[1]);
  const website = data["@graph"].find((node) => node["@type"] === "WebSite");
  assert.deepEqual(website.inLanguage, ["ko", "en", "ja", "zh-CN"]);

  const faq = data["@graph"].find((node) => node["@type"] === "FAQPage");
  assert.equal(faq.mainEntity.length, 6);

  const software = data["@graph"].find(
    (node) => node["@type"] === "SoftwareApplication",
  );
  assert.equal(software.operatingSystem, "macOS 13 or later");
  assert.equal(software.offers.price, "0");
});

test("social metadata is complete and localized", async () => {
  for (const path of contentFiles) {
    const html = await readOutput(path);
    assert.match(
      html,
      /<meta property="og:image:type" content="image\/jpeg">/,
    );
    assert.match(
      html,
      /<meta property="og:image:width" content="1000">/,
    );
    assert.match(
      html,
      /<meta property="og:image:height" content="1000">/,
    );
    assert.match(html, /<meta name="twitter:image:alt" content="[^"]+">/);
    assert.equal(
      (html.match(/property="og:locale:alternate"/g) || []).length,
      3,
      path,
    );
    if (/<body class="is-docs"/.test(html)) {
      assert.match(html, /<meta property="og:type" content="article">/);
      assert.match(
        html,
        /<meta property="article:modified_time" content="[^"]+">/,
      );
    } else {
      assert.match(html, /<meta property="og:type" content="website">/);
      assert.doesNotMatch(html, /property="article:modified_time"/);
    }
  }
});

test("structured data matches visible product facts", async () => {
  const html = await readOutput("index.html");
  const data = JSON.parse(
    html.match(
      /<script type="application\/ld\+json">([\s\S]+?)<\/script>/,
    )[1],
  );
  const software = data["@graph"].find(
    (node) => node["@type"] === "SoftwareApplication",
  );
  const page = data["@graph"].find((node) => node["@type"] === "WebPage");
  assert.equal(software.image.width, 1000);
  assert.equal(software.image.height, 1000);
  assert.ok(software.featureList.includes("Native stdio MCP server"));
  assert.match(software.softwareRequirements, /Accessibility permission/);
  assert.deepEqual(software.inLanguage, ["ko", "en", "ja", "zh-CN"]);
  assert.deepEqual(page.mainEntity, {
    "@id": `${publicUrl("ko", "home")}#software`,
  });
});

test("LLM indexes and sitemap expose all canonical localized routes", async () => {
  const [singular, plural, full, sitemap] = await Promise.all([
    readOutput("llm.txt"),
    readOutput("llms.txt"),
    readOutput("llms-full.txt"),
    readOutput("sitemap.xml"),
  ]);
  assert.equal(singular, plural);
  assert.match(
    singular,
    /Canonical website: https:\/\/channprj\.github\.io\/kmsg\//,
  );
  assert.match(singular, /Japanese documentation.*\/kmsg\/jp\//);
  assert.match(singular, /Simplified Chinese documentation.*\/kmsg\/cn\//);
  assert.match(full, /# Source: site\/content\/ko\/usage\.md/);
  assert.match(full, /# Source: site\/content\/jp\/home\.md/);
  assert.match(full, /# Source: site\/content\/cn\/home\.md/);

  for (const localeId of Object.keys(locales)) {
    for (const pageKey of Object.keys(pages)) {
      assert.match(
        sitemap,
        new RegExp(
          `<loc>${publicUrl(localeId, pageKey).replaceAll("/", "\\/")}<\\/loc>`,
        ),
      );
    }
  }
  assert.doesNotMatch(sitemap, /<loc>https:\/\/channprj\.github\.io\/kmsg\/ko\//);
  assert.match(
    sitemap,
    /<loc>https:\/\/channprj\.github\.io\/kmsg\/mcp\/<\/loc>/,
  );
  assert.match(
    sitemap,
    /<loc>https:\/\/channprj\.github\.io\/kmsg\/skill\/<\/loc>/,
  );
  assert.doesNotMatch(
    sitemap,
    /<loc>https:\/\/channprj\.github\.io\/kmsg\/(?:en\/|jp\/|cn\/)?openclaw\//,
  );
});

test("robots and app manifest point to canonical resources", async () => {
  const [robots, manifest] = await Promise.all([
    readOutput("robots.txt"),
    readOutput("site.webmanifest"),
  ]);
  assert.match(robots, /^User-agent: \*\nAllow: \//);
  assert.match(
    robots,
    /Sitemap: https:\/\/channprj\.github\.io\/kmsg\/sitemap\.xml/,
  );
  assert.match(robots, /User-agent: OAI-SearchBot\nAllow: \//);
  assert.match(robots, /User-agent: ChatGPT-User\nAllow: \//);
  const parsed = JSON.parse(manifest);
  assert.equal(parsed.start_url, "/kmsg/");
  assert.equal(parsed.short_name, "kmsg");
});
