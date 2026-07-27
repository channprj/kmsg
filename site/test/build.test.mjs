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
  openclaw: "openclaw/",
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
  "ko/versioning/index.html",
  "assets/styles.css",
  "assets/app.js",
  "assets/favicon.svg",
  "assets/kmsg-logo.jpg",
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
    versioning: "site/content/ko/versioning.md",
  };
  const visibleCopy = {
    home: "하게 사용하세요\\.",
    usage: "kmsg 사용법",
    architecture: "kmsg 아키텍처",
    openclaw: "OpenClaw 연동 가이드",
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
    en: "Read, watch, and send KakaoTalk messages from your terminal.",
    jp: "KakaoTalkをターミナルから読み取り、監視、送信。",
    cn: "在终端中读取、监控和发送KakaoTalk消息。",
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

test("AI Native headline uses yellow text on a transparent background", async () => {
  const styles = await readOutput("assets/styles.css");

  assert.match(
    styles,
    /\.hero-highlight\s*\{[^}]*background:\s*transparent;[^}]*color:\s*var\(--accent\);[^}]*\}/s,
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

test("curated home keeps product proof, stories, and install actions", async () => {
  for (const localeId of Object.keys(locales)) {
    const html = await readOutput(localizedPath(localeId, "home"));

    assert.match(html, /data-home-header/);
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

test("home routes omit background-safe messaging", async () => {
  for (const localeId of Object.keys(locales)) {
    const html = await readOutput(localizedPath(localeId, "home"));

    assert.doesNotMatch(
      html,
      /background-safe|安全なバックグラウンド読み取り|安全后台读取/i,
    );
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
    /html\[lang="ko"\] \.stories-section \.section-heading h2\s*\{[^}]*font-size:\s*clamp\(26px,\s*8\.4vw,\s*34px\);[^}]*\}/s,
  );
});

test("documentation routes retain Markdown content and table of contents", async () => {
  for (const localeId of Object.keys(locales)) {
    for (const pageKey of ["usage", "architecture", "openclaw", "versioning"]) {
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

test("IBM Plex and locale fonts keep prose readable and code distinct", async () => {
  const [root, styles] = await Promise.all([
    readOutput("index.html"),
    readOutput("assets/styles.css"),
  ]);
  assert.match(root, /family=IBM\+Plex\+Sans/);
  assert.match(root, /family=IBM\+Plex\+Sans\+KR/);
  assert.match(root, /family=IBM\+Plex\+Mono/);
  assert.match(styles, /--body:\s*"IBM Plex Sans"/);
  assert.match(styles, /--mono:\s*"IBM Plex Mono"/);
  assert.match(
    styles,
    /html\[lang="ko"\]\s*{[\s\S]*--body:\s*"IBM Plex Sans KR"/,
  );
  assert.match(styles, /body\s*{[\s\S]*word-break:\s*keep-all/);
  assert.match(
    styles,
    /code,[\s\S]*pre,[\s\S]*\.terminal-window,[\s\S]*{[\s\S]*word-break:\s*normal/,
  );
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
    assert.match(html, /data-replay-progress>03 \/ 03/);
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
  assert.match(
    app,
    /closest\("\[data-replay-scope\]"\)[\s\S]*querySelector\("\[data-replay-progress\]"\)/,
  );

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

test("every content page uses the shared shell and localized navigation", async () => {
  for (const path of contentFiles) {
    const html = await readOutput(path);
    assert.match(
      html,
      /<div class="site-shell">[\s\S]*<header[\s\S]*<main[\s\S]*<footer[\s\S]*<\/div>/,
    );
    if (/<body class="is-home"/.test(html)) {
      assert.match(
        html,
        /class="footer-llm-link"[^>]+href="[^"]*llm\.txt"/,
      );
    } else {
      assert.match(html, /class="llm-link"[^>]+href="[^"]*llm\.txt"/);
    }
    assert.match(html, /class="language-control"/);
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
    assert.doesNotMatch(html, /href="(?:\.\/|\.\.\/)[^"]+\.md(?:#|")/);
    assert.doesNotMatch(html, /javascript:/i);
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

test("curated home styles define the responsive product system", async () => {
  const styles = await readOutput("assets/styles.css");

  assert.match(styles, /--page:\s*min\(1120px,\s*calc\(100% - 48px\)\)/);
  assert.match(
    styles,
    /\.is-home \.site-header\s*{[\s\S]*border-radius:\s*999px/,
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
    /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*animation-duration:\s*0\.01ms !important/,
  );
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
  const parsed = JSON.parse(manifest);
  assert.equal(parsed.start_url, "/kmsg/");
  assert.equal(parsed.short_name, "kmsg");
});
