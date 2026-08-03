import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, posix, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

const siteDir = dirname(fileURLToPath(import.meta.url));
const repoDir = resolve(siteDir, "..");
const outputDir = join(siteDir, "dist");

const site = {
  baseUrl: "https://channprj.github.io/kmsg/",
  repositoryUrl: "https://github.com/channprj/kmsg",
  releasesUrl: "https://github.com/channprj/kmsg/releases",
  authorUrl: "https://github.com/channprj",
  authorName: "channprj",
  productName: "kmsg",
  licenseUrl: "https://github.com/channprj/kmsg/blob/main/LICENSE",
  imagePath: "assets/kmsg-logo.jpg",
  heroImagePath: "assets/kmsg-workspace.webp",
};

const localeOrder = ["ko", "en", "jp", "cn"];

const locales = {
  ko: {
    id: "ko",
    lang: "ko",
    hrefLang: "ko",
    prefix: "",
    label: "KO",
    name: "한국어",
    dateLocale: "ko-KR",
    ogLocale: "ko_KR",
    ui: {
      navigation: "주요 탐색 메뉴",
      usage: "사용법",
      architecture: "구조",
      skill: "Skill",
      skip: "본문으로 이동",
      toc: "이 페이지에서",
      source: "원본 Markdown 보기",
      sourceAction: "source",
      lightTheme: "밝은 테마로 전환",
      darkTheme: "어두운 테마로 전환",
      language: "언어 선택",
      copy: "복사",
      copied: "복사됨",
      copyFailed: "복사 실패",
      table: "스크롤 가능한 표",
      updated: "업데이트",
      edit: "GitHub에서 편집",
      pipeline: "현지화 문서",
      footerTagline: "macOS용 KakaoTalk CLI",
      footerDisclaimer: "Kakao Corp.와 무관한 독립 오픈소스 프로젝트입니다.",
    },
  },
  en: {
    id: "en",
    lang: "en",
    hrefLang: "en",
    prefix: "en",
    label: "EN",
    name: "English",
    dateLocale: "en-US",
    ogLocale: "en_US",
    ui: {
      navigation: "Primary navigation",
      usage: "Usage",
      architecture: "Architecture",
      skill: "Skill",
      skip: "Skip to content",
      toc: "On this page",
      source: "View source Markdown",
      sourceAction: "source",
      lightTheme: "Switch to light theme",
      darkTheme: "Switch to dark theme",
      language: "Select language",
      copy: "Copy",
      copied: "Copied",
      copyFailed: "Copy failed",
      table: "Scrollable table",
      updated: "Updated",
      edit: "Edit on GitHub",
      pipeline: "Canonical docs",
      footerTagline: "KakaoTalk CLI for macOS",
      footerDisclaimer: "Independent open source. Not affiliated with Kakao Corp.",
    },
  },
  jp: {
    id: "jp",
    lang: "ja",
    hrefLang: "ja",
    prefix: "jp",
    label: "JP",
    name: "日本語",
    dateLocale: "ja-JP",
    ogLocale: "ja_JP",
    ui: {
      navigation: "メインナビゲーション",
      usage: "使い方",
      architecture: "構成",
      skill: "Skill",
      skip: "本文へ移動",
      toc: "このページの内容",
      source: "Markdown原文を見る",
      sourceAction: "source",
      lightTheme: "ライトテーマに切り替え",
      darkTheme: "ダークテーマに切り替え",
      language: "言語を選択",
      copy: "コピー",
      copied: "コピーしました",
      copyFailed: "コピーできませんでした",
      table: "横にスクロールできる表",
      updated: "更新",
      edit: "GitHubで編集",
      pipeline: "日本語ドキュメント",
      footerTagline: "macOS向けKakaoTalk CLI",
      footerDisclaimer: "Kakao Corp.とは無関係の独立したオープンソースです。",
    },
  },
  cn: {
    id: "cn",
    lang: "zh-CN",
    hrefLang: "zh-CN",
    prefix: "cn",
    label: "CN",
    name: "简体中文",
    dateLocale: "zh-CN",
    ogLocale: "zh_CN",
    ui: {
      navigation: "主导航",
      usage: "使用指南",
      architecture: "架构",
      skill: "Skill",
      skip: "跳到正文",
      toc: "本页内容",
      source: "查看Markdown原文",
      sourceAction: "source",
      lightTheme: "切换到浅色主题",
      darkTheme: "切换到深色主题",
      language: "选择语言",
      copy: "复制",
      copied: "已复制",
      copyFailed: "复制失败",
      table: "可横向滚动的表格",
      updated: "更新于",
      edit: "在GitHub编辑",
      pipeline: "简体中文文档",
      footerTagline: "面向macOS的KakaoTalk CLI",
      footerDisclaimer: "独立开源项目，与Kakao Corp.无隶属关系。",
    },
  },
};

const homeContent = {
  ko: {
    kicker: "macOS용 KakaoTalk CLI · MCP 서버",
    headline: "카카오톡을\nAI Native 하게 사용하세요.",
    headlineHighlight: "AI Native",
    description:
      "macOS 손쉬운 사용 API로 동작하는 비공식 CLI입니다. 로컬 자동화와 MCP 클라이언트에서 같은 명령을 사용합니다.",
    heroImageAlt:
      "어두운 책상 위 노트북과 노란 아크릴 오브젝트",
    workflowTitle: "세 명령으로 대화를 이어갑니다.",
    workflowDescription:
      "채팅방을 찾고, 맥락을 읽고, 터미널에서 바로 답장합니다.",
    installAction: "설치하기",
    docsAction: "사용법",
    heroProof: [
      "MIT 오픈소스",
      "내 Mac에서만 로컬 실행",
      "전송 전 dry-run 확인",
    ],
    agentSkillLabel: "코딩 에이전트",
    agentSkillTitle: "코딩 에이전트에서 바로 사용하세요.",
    agentSkillDescription:
      "Claude Code와 Codex가 채팅방 탐색, 읽기, dry-run 전송을 같은 안전한 절차로 수행합니다.",
    agentSkillInstallTitle: "스킬 한 번 설치",
    agentSkillInstallDescription:
      "kmsg 바이너리를 설치한 뒤 두 에이전트에 함께 추가합니다.",
    agentSkillUseTitle: "자연어로 호출",
    agentSkillUseDescription:
      "Claude Code는 /kmsg, Codex는 $kmsg로 시작합니다.",
    agentSkillPrompt:
      "/kmsg 출시 준비 채팅방의 최근 메시지 10개를 요약해줘",
    principlesLabel: "왜 kmsg인가",
    principlesTitle: "로컬 자동화에 필요한 것만 담았습니다.",
    capabilitiesLabel: "주요 기능",
    capabilitiesTitle: "읽기부터 전송까지, 하나의 명령 체계로.",
    tagline: "모든 대화를 명령 한 줄로.\n자동화는 내 Mac을 벗어나지 않습니다.",
    storiesLabel: "실사용 후기",
    storiesTitle: "실제 자동화 워크플로우에서\n널리 사용되고 있습니다",
    storiesDescription:
      "kmsg를 에이전트와 로컬 자동화에 연결한 사용 사례입니다.",
    moreStoriesAction: "더 많은 사례 보기",
    faqLabel: "자주 묻는 질문",
    faqTitle: "kmsg를 시작하기 전에 알아둘 것.",
    faqDescription:
      "설치, 지원 환경, 접근 방식과 MCP에 관한 핵심 답변입니다.",
    installLabel: "설치",
    installTitle: "Homebrew로 바로 시작하세요.",
    installDescription:
      "macOS 13 이상, macOS용 KakaoTalk, 손쉬운 사용 권한이 필요합니다.",
    releaseAction: "최신 릴리즈",
    disclaimer: "Kakao Corp.와 무관한 독립 오픈소스 프로젝트입니다.",
    principles: [
      {
        token: "AX",
        title: "macOS에서 로컬로",
        description:
          "화면에 표시되는 KakaoTalk을 손쉬운 사용 API로 제어합니다.",
      },
      {
        token: "MCP",
        title: "CLI와 네이티브 MCP",
        description:
          "터미널, 스크립트, MCP 클라이언트에서 같은 기능을 사용합니다.",
      },
      {
        token: "{}",
        title: "구조화된 출력",
        description:
          "JSON과 텍스트는 stdout으로, AX 진단은 stderr로 분리합니다.",
      },
    ],
    capabilities: [
      {
        title: "메시지 읽기",
        description:
          "채팅을 찾고 재사용 가능한 chat_id와 최근 메시지를 가져옵니다.",
        points: ["채팅 목록 조회", "최근 메시지"],
        command: 'kmsg read "AI 프로젝트" --limit 20 --json',
        output: '{"chat_id":"chat_7f42c5e1d9ab","messages":[...]}',
      },
      {
        title: "새 메시지 감시",
        description:
          "사용 중인 KakaoTalk 창을 방해하지 않으면서 새 메시지를 확인합니다.",
        points: ["실시간 이벤트", "JSON 스트림", "복구 모드"],
        command: 'kmsg watch "AI 프로젝트" --json',
        output: '{"event":"message","author":"지나","body":"확인해줘."}',
      },
      {
        title: "안전하게 전송",
        description:
          "실제 UI로 텍스트와 이미지를 보내며 dry-run으로 먼저 검증합니다.",
        points: ["텍스트 전송", "이미지 전송", "dry-run 확인"],
        command: 'kmsg send "AI 프로젝트" "확인했어요." --dry-run',
        output: 'Would send to "AI 프로젝트": 확인했어요.',
      },
    ],
  },
  en: {
    kicker: "KakaoTalk CLI · MCP server for macOS",
    headline: "KakaoTalk, from your terminal.",
    description:
      "An unofficial CLI built on the macOS Accessibility API. Use the same commands in local automation and MCP clients.",
    heroImageAlt:
      "Laptop and yellow acrylic object on a dark desk",
    workflowTitle: "One thread, three commands.",
    workflowDescription:
      "Find the room, read its context, and reply without leaving the terminal.",
    installAction: "Install",
    docsAction: "Usage",
    heroProof: [
      "MIT open source",
      "Runs locally on your Mac",
      "Dry-run before every send",
    ],
    agentSkillLabel: "Coding agents",
    agentSkillTitle: "Use kmsg directly from your coding agent.",
    agentSkillDescription:
      "Claude Code and Codex follow the same safe workflow for chat discovery, reading, and dry-run sends.",
    agentSkillInstallTitle: "Install the skill once",
    agentSkillInstallDescription:
      "After installing the kmsg binary, add the skill to both agents.",
    agentSkillUseTitle: "Ask in natural language",
    agentSkillUseDescription:
      "Start with /kmsg in Claude Code or $kmsg in Codex.",
    agentSkillPrompt:
      "/kmsg Summarize the 10 latest messages in Release Prep",
    principlesLabel: "Why kmsg",
    principlesTitle: "Only what local automation needs.",
    capabilitiesLabel: "Core capabilities",
    capabilitiesTitle: "One command model, from reading to sending.",
    tagline: "Every chat, one command away.\nAutomation that never leaves your Mac.",
    storiesLabel: "In use",
    storiesTitle: "Used in real automation workflows.",
    storiesDescription:
      "Examples of kmsg connected to agents and local automation.",
    moreStoriesAction: "See more examples",
    faqLabel: "Frequently asked questions",
    faqTitle: "What to know before using kmsg.",
    faqDescription: "Concise answers about setup, support, access, and MCP.",
    installLabel: "Install",
    installTitle: "Start with Homebrew.",
    installDescription:
      "Requires macOS 13+, KakaoTalk for macOS, and Accessibility permission.",
    releaseAction: "Latest release",
    disclaimer: "Independent open source. Not affiliated with Kakao Corp.",
    principles: [
      {
        token: "AX",
        title: "Local on macOS",
        description:
          "Controls the visible KakaoTalk app through the Accessibility API.",
      },
      {
        token: "MCP",
        title: "CLI and native MCP",
        description:
          "Use the same capabilities from terminals, scripts, and MCP clients.",
      },
      {
        token: "{}",
        title: "Structured output",
        description:
          "JSON and text go to stdout while AX diagnostics stay on stderr.",
      },
    ],
    capabilities: [
      {
        title: "Read messages",
        description:
          "Find chats and return stable chat IDs with recent messages.",
        points: ["Chat discovery", "Recent messages"],
        command: 'kmsg read "AI Project" --limit 20 --json',
        output: '{"chat_id":"chat_7f42c5e1d9ab","messages":[...]}',
      },
      {
        title: "Watch new messages",
        description:
          "Stream new messages without taking over the active KakaoTalk window.",
        points: ["Live events", "JSON stream", "Recovery mode"],
        command: 'kmsg watch "AI Project" --json',
        output: '{"event":"message","author":"Jina","body":"Please check."}',
      },
      {
        title: "Send safely",
        description:
          "Send text and images through the visible UI, with dry-run first.",
        points: ["Text", "Images", "Dry-run confirmation"],
        command: 'kmsg send "AI Project" "Checked." --dry-run',
        output: 'Would send to "AI Project": Checked.',
      },
    ],
  },
  jp: {
    kicker: "macOS向けKakaoTalk CLI · MCPサーバー",
    headline: "KakaoTalkをターミナルから。",
    description:
      "macOSアクセシビリティAPIで動作する非公式CLIです。ローカル自動化とMCPクライアントで同じコマンドを利用できます。",
    heroImageAlt:
      "暗いデスクに置かれたノートパソコンと黄色いアクリル",
    workflowTitle: "3つのコマンドで会話を続ける。",
    workflowDescription:
      "チャットを探し、文脈を読み、ターミナルからそのまま返信します。",
    installAction: "インストール",
    docsAction: "使い方",
    heroProof: [
      "MITオープンソース",
      "Macの中だけでローカル実行",
      "送信前にdry-runで確認",
    ],
    agentSkillLabel: "コーディングエージェント",
    agentSkillTitle: "コーディングエージェントからすぐに利用。",
    agentSkillDescription:
      "Claude CodeとCodexが、チャット検索・読み取り・dry-run送信を同じ安全な手順で実行します。",
    agentSkillInstallTitle: "スキルを一度インストール",
    agentSkillInstallDescription:
      "kmsg本体をインストールした後、両方のエージェントに追加します。",
    agentSkillUseTitle: "自然な言葉で呼び出す",
    agentSkillUseDescription:
      "Claude Codeでは/kmsg、Codexでは$kmsgから始めます。",
    agentSkillPrompt:
      "/kmsg リリース準備の最新メッセージ10件を要約して",
    principlesLabel: "kmsgを選ぶ理由",
    principlesTitle: "ローカル自動化に必要な機能だけ。",
    capabilitiesLabel: "主な機能",
    capabilitiesTitle: "読み取りから送信まで、一つのコマンド体系で。",
    tagline: "すべての会話を、コマンド一つで。\n自動化はMacの外に出ません。",
    storiesLabel: "活用事例",
    storiesTitle: "実際の自動化ワークフローで使われています。",
    storiesDescription:
      "kmsgをエージェントとローカル自動化に接続した事例です。",
    moreStoriesAction: "その他の活用事例を見る",
    faqLabel: "よくある質問",
    faqTitle: "kmsgを使う前に知っておくこと。",
    faqDescription:
      "導入、対応環境、アクセス方法、MCPの要点です。",
    installLabel: "インストール",
    installTitle: "Homebrewですぐに開始。",
    installDescription:
      "macOS 13以降、macOS版KakaoTalk、アクセシビリティ権限が必要です。",
    releaseAction: "最新リリース",
    disclaimer:
      "Kakao Corp.とは無関係の独立したオープンソースです。",
    principles: [
      {
        token: "AX",
        title: "macOS上でローカル動作",
        description:
          "表示中のKakaoTalkをアクセシビリティAPIで操作します。",
      },
      {
        token: "MCP",
        title: "CLIとネイティブMCP",
        description:
          "ターミナル、スクリプト、MCPクライアントで同じ機能を使えます。",
      },
      {
        token: "{}",
        title: "構造化出力",
        description:
          "JSONとテキストはstdoutへ、AX診断はstderrへ分離します。",
      },
    ],
    capabilities: [
      {
        title: "メッセージを読む",
        description:
          "チャットを検索し、再利用可能なchat_idと最近のメッセージを取得します。",
        points: ["チャット検索", "最近のメッセージ"],
        command: 'kmsg read "AIプロジェクト" --limit 20 --json',
        output: '{"chat_id":"chat_7f42c5e1d9ab","messages":[...]}',
      },
      {
        title: "新着を監視",
        description:
          "使用中のKakaoTalkウィンドウを妨げず、新着を継続的に確認します。",
        points: ["リアルタイムイベント", "JSONストリーム", "復旧モード"],
        command: 'kmsg watch "AIプロジェクト" --json',
        output: '{"event":"message","author":"ジナ","body":"確認して。"}',
      },
      {
        title: "安全に送信",
        description:
          "表示中のUIからテキストと画像を送り、dry-runで事前確認できます。",
        points: ["テキスト", "画像", "dry-run確認"],
        command: 'kmsg send "AIプロジェクト" "確認しました。" --dry-run',
        output: 'Would send to "AIプロジェクト": 確認しました。',
      },
    ],
  },
  cn: {
    kicker: "面向macOS的KakaoTalk CLI · MCP服务器",
    headline: "在终端中使用KakaoTalk。",
    description:
      "基于macOS辅助功能API的非官方CLI。在本地自动化和MCP客户端中使用同一套命令。",
    heroImageAlt:
      "深色桌面上的笔记本电脑和黄色亚克力方块",
    workflowTitle: "三条命令，完成一次对话。",
    workflowDescription:
      "查找聊天、读取上下文，然后直接在终端中回复。",
    installAction: "安装",
    docsAction: "使用指南",
    heroProof: [
      "MIT开源",
      "仅在你的Mac上本地运行",
      "发送前先dry-run确认",
    ],
    agentSkillLabel: "编程智能体",
    agentSkillTitle: "直接在编程智能体中使用kmsg。",
    agentSkillDescription:
      "Claude Code与Codex使用同一套安全流程查找聊天、读取消息并在发送前进行dry-run。",
    agentSkillInstallTitle: "一次安装技能",
    agentSkillInstallDescription:
      "安装kmsg命令行工具后，将技能同时添加到两个智能体。",
    agentSkillUseTitle: "使用自然语言调用",
    agentSkillUseDescription:
      "在Claude Code中使用/kmsg，在Codex中使用$kmsg。",
    agentSkillPrompt:
      "/kmsg 总结发布准备聊天中的最近10条消息",
    principlesLabel: "为什么选择kmsg",
    principlesTitle: "只保留本地自动化所需的功能。",
    capabilitiesLabel: "核心功能",
    capabilitiesTitle: "从读取到发送，使用同一套命令体系。",
    tagline: "每一段对话，只差一条命令。\n自动化从不离开你的Mac。",
    storiesLabel: "实际案例",
    storiesTitle: "已用于真实的自动化工作流。",
    storiesDescription:
      "kmsg连接智能体与本地自动化的实际案例。",
    moreStoriesAction: "查看更多案例",
    faqLabel: "常见问题",
    faqTitle: "使用kmsg前需要了解的内容。",
    faqDescription:
      "关于安装、支持环境、访问方式和MCP的核心解答。",
    installLabel: "安装",
    installTitle: "使用Homebrew立即开始。",
    installDescription:
      "需要macOS 13或更高版本、macOS版KakaoTalk和辅助功能权限。",
    releaseAction: "最新版本",
    disclaimer: "独立开源项目，与Kakao Corp.无隶属关系。",
    principles: [
      {
        token: "AX",
        title: "在macOS本地运行",
        description:
          "通过辅助功能API控制屏幕上可见的KakaoTalk应用。",
      },
      {
        token: "MCP",
        title: "CLI与原生MCP",
        description:
          "在终端、脚本和MCP客户端中使用相同功能。",
      },
      {
        token: "{}",
        title: "结构化输出",
        description:
          "JSON和文本写入stdout，AX诊断信息保留在stderr。",
      },
    ],
    capabilities: [
      {
        title: "读取消息",
        description: "查找聊天并返回可复用的chat_id与最近消息。",
        points: ["聊天查找", "最近消息"],
        command: 'kmsg read "AI项目" --limit 20 --json',
        output: '{"chat_id":"chat_7f42c5e1d9ab","messages":[...]}',
      },
      {
        title: "监控新消息",
        description:
          "不干扰正在使用的KakaoTalk窗口，持续获取新消息。",
        points: ["实时事件", "JSON流", "恢复模式"],
        command: 'kmsg watch "AI项目" --json',
        output: '{"event":"message","author":"Jina","body":"请确认。"}',
      },
      {
        title: "安全发送",
        description:
          "通过可见界面发送文本和图片，并先用dry-run确认。",
        points: ["文本", "图片", "dry-run确认"],
        command: 'kmsg send "AI项目" "已确认。" --dry-run',
        output: 'Would send to "AI项目": 已确认。',
      },
    ],
  },
};

const homeStories = [
  {
    publisher: "Builder Josh",
    title: {
      ko: "헤르메스 에이전트 5개로 뉴스 큐레이션부터 주식 매매까지 자동화한 방법",
      en: "How five Hermes agents automate news curation and stock trading",
      jp: "5つのHermesエージェントでニュース収集から株式取引まで自動化",
      cn: "用5个Hermes智能体自动完成新闻整理与股票交易",
    },
    href: "https://www.youtube.com/watch?v=_Pd1G33_R48&t=1020s",
    image: "https://i.ytimg.com/vi/_Pd1G33_R48/maxresdefault.jpg",
  },
  {
    publisher: "Sam Hottman",
    title: {
      ko: "나만의 Hermes 시스템 구축 방법",
      en: "How to build your own Hermes system",
      jp: "自分専用のHermesシステムを構築する方法",
      cn: "如何构建自己的Hermes系统",
    },
    href: "https://www.youtube.com/watch?v=xz5fA7OyvQ0",
    image: "https://i.ytimg.com/vi/xz5fA7OyvQ0/maxresdefault.jpg",
  },
];

const pageDefinitions = [
  {
    key: "home",
    slug: "",
    type: "home",
    sources: {
      ko: "README.md",
      en: "README.en.md",
      jp: "site/content/jp/home.md",
      cn: "site/content/cn/home.md",
    },
    translations: {
      ko: {
        title: "kmsg — macOS용 카카오톡 CLI 및 MCP 서버",
        description:
          "macOS용 비공식 카카오톡 CLI 및 네이티브 MCP 서버입니다. 손쉬운 사용 자동화로 메시지를 읽고, 감시하고, 전송합니다.",
        eyebrow: "카카오톡 자동화 · macOS 13 이상",
        sourceLabel: "README.md에서 자동 생성",
        faqHeading: "자주 묻는 질문",
        previewLabel:
          "kmsg로 채팅 목록을 확인하고 메시지를 읽은 뒤 답장을 보내는 터미널 미리보기",
        chatName: "AI 프로젝트",
        secondaryChat: "출시 준비",
        firstSender: "지나",
        firstMessage: "새 메시지를 확인해줘.",
        secondMessage: "지금 확인할게요.",
        replyMessage: "확인했어요.",
        firstTime: "오후 1:41",
        secondTime: "오후 1:42",
      },
      en: {
        title: "kmsg — KakaoTalk CLI & MCP server for macOS",
        description:
          "Unofficial KakaoTalk CLI and native MCP server for macOS. Read, watch, and send messages through Accessibility automation for scripts and AI agents.",
        eyebrow: "KakaoTalk automation · macOS 13+",
        sourceLabel: "Generated from README.en.md",
        faqHeading: "Frequently asked questions",
        previewLabel:
          "Terminal replay showing kmsg listing chats, reading messages, and sending a reply",
        chatName: "AI Project",
        secondaryChat: "Release Prep",
        firstSender: "Jina",
        firstMessage: "Please check the latest messages.",
        secondMessage: "I will check them now.",
        replyMessage: "I've checked them.",
        firstTime: "1:41 PM",
        secondTime: "1:42 PM",
      },
      jp: {
        title: "kmsg — macOS向けKakaoTalk CLI / MCPサーバー",
        description:
          "KakaoTalkをmacOSのアクセシビリティAPIで読み取り、監視、送信できる非公式CLI兼ネイティブMCPサーバーです。",
        eyebrow: "KakaoTalk自動化 · macOS 13以降",
        sourceLabel: "日本語ドキュメント",
        faqHeading: "よくある質問",
        previewLabel:
          "kmsgでチャット一覧を確認し、メッセージを読んで返信するターミナル",
        chatName: "AIプロジェクト",
        secondaryChat: "リリース準備",
        firstSender: "ジナ",
        firstMessage: "新着メッセージを確認して。",
        secondMessage: "今確認します。",
        replyMessage: "確認しました。",
        firstTime: "午後1:41",
        secondTime: "午後1:42",
      },
      cn: {
        title: "kmsg — 面向macOS的KakaoTalk CLI与MCP服务器",
        description:
          "通过macOS辅助功能API读取、监控和发送KakaoTalk消息的非官方CLI与原生MCP服务器。",
        eyebrow: "KakaoTalk自动化 · macOS 13+",
        sourceLabel: "简体中文文档",
        faqHeading: "常见问题",
        previewLabel: "使用kmsg查看聊天列表、读取消息并发送回复的终端演示",
        chatName: "AI项目",
        secondaryChat: "发布准备",
        firstSender: "Jina",
        firstMessage: "请确认最新消息。",
        secondMessage: "我现在确认。",
        replyMessage: "已经确认。",
        firstTime: "下午1:41",
        secondTime: "下午1:42",
      },
    },
  },
  {
    key: "usage",
    slug: "usage",
    type: "docs",
    sources: {
      ko: "site/content/ko/usage.md",
      en: "USAGE.md",
      jp: "site/content/jp/usage.md",
      cn: "site/content/cn/usage.md",
    },
    translations: {
      ko: {
        title: "kmsg 사용법 — macOS에서 KakaoTalk 자동화하기",
        description:
          "kmsg 설치, 전체 명령, JSON 출력, 안전한 읽기, KakaoTalk 자동화 문제 해결 방법을 안내합니다.",
        eyebrow: "문서 · 사용법",
      },
      en: {
        title: "kmsg Usage — install and automate KakaoTalk on macOS",
        description:
          "Install kmsg, learn every command, configure JSON output, and troubleshoot KakaoTalk Accessibility automation on macOS.",
        eyebrow: "Documentation · Usage",
      },
      jp: {
        title: "kmsgの使い方 — macOSでKakaoTalkを自動化",
        description:
          "インストール、主要コマンド、安全な読み取り、JSON、MCP、トラブルシューティングを説明します。",
        eyebrow: "ドキュメント · 使い方",
      },
      cn: {
        title: "kmsg使用指南 — 在macOS上自动化KakaoTalk",
        description:
          "介绍安装、主要命令、安全读取、JSON、MCP和故障排除。",
        eyebrow: "文档 · 使用指南",
      },
    },
  },
  {
    key: "architecture",
    slug: "architecture",
    type: "docs",
    sources: {
      ko: "site/content/ko/architecture.md",
      en: "ARCHITECTURE.md",
      jp: "site/content/jp/architecture.md",
      cn: "site/content/cn/architecture.md",
    },
    translations: {
      ko: {
        title: "kmsg 아키텍처 — macOS 손쉬운 사용 자동화",
        description:
          "Swift와 macOS 손쉬운 사용 API로 KakaoTalk을 자동화하는 구조와 설계 결정을 설명합니다.",
        eyebrow: "문서 · 아키텍처",
      },
      en: {
        title: "kmsg Architecture — macOS Accessibility automation",
        description:
          "How kmsg uses Swift and the macOS Accessibility API to read, watch, and send KakaoTalk messages without implementing the private LOCO protocol.",
        eyebrow: "Documentation · Architecture",
      },
      jp: {
        title: "kmsgアーキテクチャ — macOSアクセシビリティ自動化",
        description:
          "SwiftとmacOSアクセシビリティAPIを使う構造、データフロー、設計判断を説明します。",
        eyebrow: "ドキュメント · アーキテクチャ",
      },
      cn: {
        title: "kmsg架构 — macOS辅助功能自动化",
        description:
          "介绍基于Swift和macOS辅助功能API的组件、数据流与设计决策。",
        eyebrow: "文档 · 架构",
      },
    },
  },
  {
    key: "openclaw",
    slug: "mcp",
    type: "docs",
    sources: {
      ko: "site/content/ko/openclaw.md",
      en: "docs/openclaw.md",
      jp: "site/content/jp/openclaw.md",
      cn: "site/content/cn/openclaw.md",
    },
    translations: {
      ko: {
        title: "kmsg와 OpenClaw·MCP 클라이언트 연결하기",
        description:
          "네이티브 kmsg MCP 서버, 실시간 감시, 승인 중심 전송 흐름을 구성합니다.",
        eyebrow: "문서 · MCP & OpenClaw",
      },
      en: {
        title: "Connect kmsg to OpenClaw and MCP clients",
        description:
          "Configure the native kmsg MCP server and real-time watch mode for OpenClaw and other AI agent clients.",
        eyebrow: "Documentation · MCP & OpenClaw",
      },
      jp: {
        title: "kmsgをOpenClawとMCPクライアントへ接続",
        description:
          "ネイティブMCPサーバー、リアルタイム監視、承認付き送信フローを構成します。",
        eyebrow: "ドキュメント · MCP & OpenClaw",
      },
      cn: {
        title: "将kmsg接入OpenClaw与MCP客户端",
        description:
          "配置原生MCP服务器、实时监控和带审批的发送流程。",
        eyebrow: "文档 · MCP & OpenClaw",
      },
    },
  },
  {
    key: "skill",
    slug: "skill",
    type: "docs",
    sources: {
      ko: "site/content/ko/skill.md",
      en: "site/content/en/skill.md",
      jp: "site/content/jp/skill.md",
      cn: "site/content/cn/skill.md",
    },
    translations: {
      ko: {
        title: "kmsg 코딩 에이전트 Skill — Claude Code와 Codex에서 사용하기",
        description:
          "Claude Code와 Codex에 kmsg Skill을 설치하고 KakaoTalk을 안전하게 탐색, 읽기, 전송하는 기본 절차를 안내합니다.",
        eyebrow: "문서 · 코딩 에이전트 Skill",
      },
      en: {
        title:
          "kmsg coding agent Skill — use KakaoTalk from Claude Code and Codex",
        description:
          "Install the kmsg Skill for Claude Code and Codex, then follow a safe workflow to find, read, and send KakaoTalk messages.",
        eyebrow: "Documentation · Coding agent Skill",
      },
      jp: {
        title:
          "kmsgコーディングエージェントSkill — Claude CodeとCodexで利用",
        description:
          "Claude CodeとCodexにkmsg Skillをインストールし、KakaoTalkを安全に探し、読み取り、送信する手順を説明します。",
        eyebrow: "ドキュメント · コーディングエージェントSkill",
      },
      cn: {
        title: "kmsg编程智能体Skill — 在Claude Code与Codex中使用",
        description:
          "在Claude Code和Codex中安装kmsg Skill，并按照安全流程查找、读取和发送KakaoTalk消息。",
        eyebrow: "文档 · 编程智能体Skill",
      },
    },
  },
  {
    key: "versioning",
    slug: "versioning",
    type: "docs",
    sources: {
      ko: "site/content/ko/versioning.md",
      en: "VERSIONING.md",
      jp: "site/content/jp/versioning.md",
      cn: "site/content/cn/versioning.md",
    },
    translations: {
      ko: {
        title: "kmsg 버전 관리와 릴리스 자동화",
        description:
          "날짜 기반 버전 형식, 기준 파일, 릴리스 명령, 호환성 규칙을 설명합니다.",
        eyebrow: "문서 · 버전 관리",
      },
      en: {
        title: "kmsg Versioning and release automation",
        description:
          "Understand the date-based kmsg version format, source of truth, release commands, and compatibility rules.",
        eyebrow: "Documentation · Versioning",
      },
      jp: {
        title: "kmsgのバージョン管理とリリース自動化",
        description:
          "日付ベースの形式、正式な値、リリースコマンド、互換性を説明します。",
        eyebrow: "ドキュメント · バージョン管理",
      },
      cn: {
        title: "kmsg版本管理与发布自动化",
        description:
          "介绍日期版本格式、唯一来源、发布命令和兼容性规则。",
        eyebrow: "文档 · 版本管理",
      },
    },
  },
];

const routePathFor = (localeId, slug) => {
  const parts = [locales[localeId].prefix, slug].filter(Boolean);
  return parts.length > 0 ? `${parts.join("/")}/` : "";
};

const pages = pageDefinitions.flatMap((definition) =>
  localeOrder.map((localeId) => {
    const locale = locales[localeId];
    const path = routePathFor(localeId, definition.slug);
    return {
      ...definition.translations[localeId],
      pageKey: definition.key,
      source: definition.sources[localeId],
      canonicalSource: definition.sources.en,
      output: path ? `${path}index.html` : "index.html",
      path,
      lang: locale.lang,
      locale: localeId,
      localeConfig: locale,
      type: definition.type,
    };
  }),
);

const pageByLocaleAndKey = new Map(
  pages.map((page) => [`${page.locale}:${page.pageKey}`, page]),
);

const localizedPage = (localeId, pageKey) =>
  pageByLocaleAndKey.get(`${localeId}:${pageKey}`);

marked.setOptions({
  gfm: true,
  breaks: false,
});

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const iconFiles = {
  "arrow-right": "arrow-right.svg",
  "external-link": "arrow-square-out.svg",
  copy: "copy.svg",
  check: "check.svg",
  "chevron-down": "caret-down.svg",
  plus: "plus.svg",
  minus: "minus.svg",
  search: "magnifying-glass.svg",
  sun: "sun.svg",
  moon: "moon.svg",
};

const iconSourceDir = join(
  siteDir,
  "node_modules",
  "@phosphor-icons",
  "core",
  "assets",
  "regular",
);

const iconSources = Object.fromEntries(
  Object.entries(iconFiles).map(([name, filename]) => [
    name,
    readFileSync(join(iconSourceDir, filename), "utf8").trim(),
  ]),
);

const renderIcon = (name, size = 20) => {
  const source = iconSources[name];
  if (!source) throw new Error(`Unknown icon: ${name}`);
  return source.replace(
    "<svg ",
    `<svg class="ui-icon ui-icon-${size}" data-icon="${name}" aria-hidden="true" focusable="false" `,
  );
};

const renderCopyIcons = () => `
  <span class="copy-icons" aria-hidden="true">
    ${renderIcon("copy", 18)}
    ${renderIcon("check", 18)}
  </span>`;

const stripTags = (value) =>
  sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();

const stripMarkdown = (value) => stripTags(marked.parse(value));

const slugify = (value) => {
  const slug = stripTags(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "section";
};

const relativeAsset = (output, target) => {
  const path = relative(dirname(output), target).split("\\").join("/");
  return path.startsWith(".") ? path : `./${path}`;
};

const pageUrl = (path) => new URL(path, site.baseUrl).href;

const gitLastModified = (...sources) => {
  for (const source of sources) {
    try {
      const modified = execFileSync(
        "git",
        ["log", "-1", "--format=%cI", "--", source],
        { cwd: repoDir, encoding: "utf8" },
      ).trim();
      if (modified) return modified;
    } catch {
      // Try the canonical source before falling back to the Unix epoch.
    }
  }
  return new Date(0).toISOString();
};

const markdownPageKey = (rawPath) => {
  const normalized = rawPath.replaceAll("\\", "/").replace(/^(\.\.\/)+/, "");
  const basename = posix.basename(normalized).toLowerCase();
  if (["readme.md", "readme.en.md", "home.md"].includes(basename)) {
    return "home";
  }
  if (["usage.md", "usage"].includes(basename)) return "usage";
  if (["architecture.md", "architecture"].includes(basename)) {
    return "architecture";
  }
  if (["openclaw.md", "openclaw"].includes(basename)) return "openclaw";
  if (["skill.md", "skill"].includes(basename)) return "skill";
  if (["versioning.md", "versioning"].includes(basename)) return "versioning";
  return null;
};

const localizedAnchor = (anchor, localeId) => {
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
  };
  return anchors[anchor]?.[localeId] ?? anchor;
};

const resolveMarkdownTarget = (target, page) => {
  if (
    target.startsWith("#") ||
    target.startsWith("http://") ||
    target.startsWith("https://") ||
    target.startsWith("mailto:")
  ) {
    return target;
  }

  const [rawPath, anchor = ""] = target.split("#", 2);
  const targetPageKey = markdownPageKey(rawPath);
  const targetPage = targetPageKey
    ? localizedPage(page.locale, targetPageKey)
    : null;
  const suffix = anchor
    ? `#${localizedAnchor(anchor, page.locale)}`
    : "";

  if (targetPage) {
    return `${relativeAsset(page.output, targetPage.output)}${suffix}`;
  }

  const sourceRelativePath = posix.normalize(
    posix.join(posix.dirname(page.source), rawPath),
  );

  if (sourceRelativePath.startsWith("assets/")) {
    return `${relativeAsset(page.output, sourceRelativePath)}${suffix}`;
  }

  return `${site.repositoryUrl}/blob/main/${sourceRelativePath}${suffix}`;
};

const rewriteMarkdownLinks = (markdown, page) =>
  markdown.replace(
    /(!?\[[^\]]*])\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (match, label, target) =>
      `${label}(${resolveMarkdownTarget(target, page)})`,
  );

const prepareMarkdown = (markdown, page) => {
  const lines = markdown.split("\n");
  let skippedTitle = false;

  const filtered = lines.filter((line) => {
    if (!skippedTitle && line.startsWith("# ")) {
      skippedTitle = true;
      return false;
    }
    if (/^\[!\[.+]\(https:\/\/img\.shields\.io\//.test(line)) return false;
    if (/^\[(한국어|English)]\(.+\)$/.test(line)) return false;
    if (/^<p><img src="assets\/kmsg-logo\.jpg"/.test(line)) return false;
    return true;
  });

  return rewriteMarkdownLinks(filtered.join("\n").trim(), page);
};

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
};

const enhanceRenderedMarkdown = (html, page) => {
  const headingCounts = new Map();
  const headings = [];

  let enhanced = html.replace(
    /<h([2-4])>([\s\S]*?)<\/h\1>/g,
    (match, level, content) => {
      const baseSlug = slugify(content);
      const count = headingCounts.get(baseSlug) ?? 0;
      headingCounts.set(baseSlug, count + 1);
      const id = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;
      const label = stripTags(content);
      headings.push({ level: Number(level), id, label });
      return `<h${level} id="${id}"><a class="heading-anchor" href="#${id}">${content}</a></h${level}>`;
    },
  );

  enhanced = enhanced.replace(
    /<p><a href="(https:\/\/github\.com\/user-attachments\/assets\/[^"]+)">\1<\/a><\/p>/g,
    `<div class="media-frame"><video src="${relativeAsset(page.output, "assets/demo1.mp4")}" controls preload="metadata" playsinline aria-label="${escapeHtml(page.previewLabel ?? "kmsg command line demo")}"><track kind="captions" srclang="en" label="English" src="${relativeAsset(page.output, "assets/demo-captions.vtt")}" default></video></div>`,
  );

  enhanced = enhanced.replace(
    /(<h2 id="(?:실사용-후기|featured-video)">[\s\S]*?<\/h2>)\s*<p>(<a[^>]+><img[^>]+><\/a>)<\/p>\s*<p>([\s\S]*?)<\/p>\s*<p>(<a[^>]+><img[^>]+><\/a>)<\/p>\s*<p>([\s\S]*?)<\/p>/,
    `$1
<div class="story-grid">
  <article class="story-card">
    <div class="story-media">$2</div>
    <div class="story-copy"><p>$3</p></div>
  </article>
  <article class="story-card">
    <div class="story-media">$4</div>
    <div class="story-copy"><p>$5</p></div>
  </article>
</div>`,
  );

  const tableLabel = page.localeConfig.ui.table;
  enhanced = enhanced
    .replace(
      /<table>/g,
      `<div class="table-scroll" tabindex="0" role="region" aria-label="${tableLabel}"><table>`,
    )
    .replace(/<\/table>/g, "</table></div>");

  enhanced = enhanced.replace(
    /<pre><code/g,
    `<pre><button class="code-copy copy-control" type="button" aria-label="${escapeHtml(page.localeConfig.ui.copy)}" aria-live="polite" data-code-copy data-copied-label="${escapeHtml(page.localeConfig.ui.copied)}" data-copy-failed-label="${escapeHtml(page.localeConfig.ui.copyFailed)}">${renderCopyIcons()}<span data-copy-label>${escapeHtml(page.localeConfig.ui.copy)}</span></button><code`,
  );

  enhanced = enhanced.replace(
    /<a href="(https?:\/\/[^"]+)">/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">',
  );

  return { html: enhanced, headings };
};

const renderMarkdown = (markdown, page) => {
  const prepared = prepareMarkdown(markdown, page);
  const unsafeHtml = marked.parse(prepared);
  const safeHtml = sanitizeHtml(unsafeHtml, sanitizeOptions);
  return enhanceRenderedMarkdown(safeHtml, page);
};

const extractIntro = (markdown) => {
  const paragraphs = markdown
    .replace(/^# .+$/m, "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const candidate = paragraphs.find((paragraph) =>
    /^`kmsg`(?:는|은| is|は|是一)/.test(paragraph),
  );

  return candidate ? stripMarkdown(candidate) : "";
};

const extractFaqs = (markdown, page) => {
  if (!page.faqHeading) return [];
  const sectionTitle = `## ${page.faqHeading ?? ""}`;
  const start = markdown.indexOf(sectionTitle);
  if (start === -1) return [];

  const section = markdown.slice(start + sectionTitle.length);
  const end = section.search(/^##\s/m);
  const faqMarkdown = end === -1 ? section : section.slice(0, end);
  const chunks = faqMarkdown.split(/^###\s+/m).slice(1);

  return chunks
    .map((chunk) => {
      const [question, ...answerLines] = chunk.split("\n");
      return {
        question: stripMarkdown(question),
        answer: stripMarkdown(answerLines.join("\n").trim()),
      };
    })
    .filter(({ question, answer }) => question && answer);
};

const renderToc = (headings, page) => {
  const items = headings
    .filter(({ level }) => level === 2)
    .map(
      ({ id, label }) =>
        `<li><a href="#${id}" data-toc-link>${escapeHtml(label)}</a></li>`,
    )
    .join("");

  const { ui } = page.localeConfig;
  const label = ui.toc;
  return `
    <aside class="toc" aria-label="${label}">
      <p class="toc-label">${label}</p>
      <ol>${items}</ol>
      <a class="toc-source" href="${site.repositoryUrl}/blob/main/${page.source}" target="_blank" rel="noopener noreferrer">
        ${escapeHtml(ui.source)}
        ${renderIcon("external-link", 16)}
      </a>
    </aside>`;
};

const renderHeader = (page) => {
  const { ui } = page.localeConfig;
  const rootLink = relativeAsset(
    page.output,
    localizedPage(page.locale, "home").output,
  );
  const usageLink = relativeAsset(
    page.output,
    localizedPage(page.locale, "usage").output,
  );
  const architectureLink = relativeAsset(
    page.output,
    localizedPage(page.locale, "architecture").output,
  );
  const mcpLink = relativeAsset(
    page.output,
    localizedPage(page.locale, "openclaw").output,
  );
  const skillLink = relativeAsset(
    page.output,
    localizedPage(page.locale, "skill").output,
  );
  const languageOptions = localeOrder
    .map((localeId) => {
      const locale = locales[localeId];
      const target = localizedPage(localeId, page.pageKey);
      return `<option value="${relativeAsset(page.output, target.output)}" data-locale="${localeId}"${localeId === page.locale ? " selected" : ""}>${locale.label} · ${locale.name}</option>`;
    })
    .join("");
  const active = (pageKey) =>
    page.pageKey === pageKey ? ' aria-current="page"' : "";

  return `
    <header class="site-header" data-header>
      <div class="header-inner">
        <a class="brand" href="${rootLink}" aria-label="kmsg home" translate="no">
          <img src="${relativeAsset(page.output, site.imagePath)}" alt="" width="32" height="32">
          <span>kmsg</span>
        </a>
        <nav class="primary-nav" aria-label="${ui.navigation}" tabindex="0">
          <a href="${usageLink}"${active("usage")}>${ui.usage}</a>
          <a href="${architectureLink}"${active("architecture")}>${ui.architecture}</a>
          <a href="${mcpLink}"${active("openclaw")}>MCP</a>
          <a href="${skillLink}"${active("skill")}>${ui.skill}</a>
          <a href="${site.repositoryUrl}" target="_blank" rel="noopener noreferrer">GitHub ${renderIcon("external-link", 16)}</a>
        </nav>
        <div class="header-tools">
          <label class="language-control">
            <span class="sr-only">${ui.language}</span>
            <select aria-label="${ui.language}" data-language-select>
              ${languageOptions}
            </select>
            <span class="language-chevron" aria-hidden="true">${renderIcon("chevron-down", 18)}</span>
          </label>
          <button class="theme-toggle" type="button" aria-label="${ui.lightTheme}" data-theme-toggle data-light-label="${ui.lightTheme}" data-dark-label="${ui.darkTheme}">
            <span class="theme-icon" aria-hidden="true">
              ${renderIcon("sun", 18)}
              ${renderIcon("moon", 18)}
            </span>
          </button>
        </div>
      </div>
    </header>`;
};

const renderReplayCommand = (stage, command) => `
  <div class="terminal-line terminal-command-line" data-replay-line data-replay-stage="${stage}" data-replay-kind="command">
    <span class="terminal-prompt">$</span>
    <span class="terminal-command" data-replay-command>${escapeHtml(command)}</span>
    <span class="cursor-block" aria-hidden="true"></span>
  </div>`;

const renderReplayOutput = (stage, output, tone = "") => `
  <div class="terminal-line terminal-output-line${tone ? ` ${tone}` : ""}" data-replay-line data-replay-stage="${stage}">${escapeHtml(output)}</div>`;

const renderReplayGap = (stage) => `
  <div class="terminal-line terminal-output-gap" data-replay-line data-replay-stage="${stage}" aria-hidden="true"></div>`;

const renderWorkflowTerminal = (page) => {
  const chatID = "chat_7f42c5e1d9ab";
  const secondaryChatID = "chat_81e0c8b9a214";

  return `
    <div class="terminal-window" data-terminal-replay translate="no">
      <div class="terminal-bar">
        <div class="traffic-lights" aria-hidden="true"><i></i><i></i><i></i></div>
      </div>
      <div class="terminal-body" aria-hidden="true">
        <div class="terminal-transcript" data-replay-transcript data-replay-viewport>
          ${renderReplayCommand(1, "kmsg chats --limit 2")}
          ${renderReplayOutput(1, "Searching for chat list in KakaoTalk...", "terminal-muted")}
          ${renderReplayGap(1)}
          ${renderReplayOutput(1, "Found 2 chat(s):")}
          ${renderReplayGap(1)}
          ${renderReplayOutput(1, `[1] ${page.chatName}`, "terminal-highlight")}
          ${renderReplayOutput(1, `    chat_id: ${chatID}`, "terminal-muted")}
          ${renderReplayOutput(1, `[2] ${page.secondaryChat}`)}
          ${renderReplayOutput(1, `    chat_id: ${secondaryChatID}`, "terminal-muted")}
          ${renderReplayGap(1)}
          ${renderReplayCommand(2, `kmsg read "${page.chatName}" --limit 2 --keep-window`)}
          ${renderReplayOutput(2, `Reading messages from: ${page.chatName}`)}
          ${renderReplayGap(2)}
          ${renderReplayOutput(2, "Recent messages (2):")}
          ${renderReplayGap(2)}
          ${renderReplayOutput(2, `[1] author: ${page.firstSender}`, "terminal-highlight")}
          ${renderReplayOutput(2, `    time: ${page.firstTime}`, "terminal-muted")}
          ${renderReplayOutput(2, `    body: ${page.firstMessage}`)}
          ${renderReplayGap(2)}
          ${renderReplayOutput(2, "[2] author: (me)")}
          ${renderReplayOutput(2, `    time: ${page.secondTime}`, "terminal-muted")}
          ${renderReplayOutput(2, `    body: ${page.secondMessage}`)}
          ${renderReplayGap(2)}
          ${renderReplayCommand(3, `kmsg send "${page.chatName}" "${page.replyMessage}"`)}
          ${renderReplayOutput(3, `Looking for chat with '${page.chatName}'...`)}
          ${renderReplayOutput(3, "Found existing chat window.")}
          ${renderReplayOutput(3, `✓ Message sent to '${page.chatName}'`, "terminal-success")}
          ${renderReplayOutput(3, "✓ Chat window closed.", "terminal-success")}
          ${renderReplayGap(3)}
          <div class="terminal-line terminal-command-line terminal-return-line" data-replay-line data-replay-stage="3">
            <span class="terminal-prompt">$</span>
            <span class="terminal-command" data-replay-command></span>
            <span class="cursor-block" aria-hidden="true"></span>
          </div>
        </div>
      </div>
    </div>`;
};

const renderTextWithLineBreaks = (text) =>
  text
    .split("\n")
    .map((line) => escapeHtml(line))
    .join("<br>");

const renderSectionHeading = (label, title, description = "") => `
  <header class="section-heading">
    <span class="sr-only">${escapeHtml(label)}</span>
    <h2>${renderTextWithLineBreaks(title)}</h2>
    ${description ? `<p>${escapeHtml(description)}</p>` : ""}
  </header>`;

const renderCommandPanel = (command, output) => `
  <figure class="command-panel" tabindex="0" role="region" aria-label="${escapeHtml(command)}" translate="no">
    <figcaption aria-hidden="true">shell</figcaption>
    <pre><code translate="no"><span class="command-prompt">$</span> ${escapeHtml(command)}
<span class="command-output">${escapeHtml(output)}</span></code></pre>
  </figure>`;

const renderHomeWorkflow = (page, copy) => `
  <section class="product-workflow" id="workflow" data-replay-scope>
    <div class="workflow-intro">
      <h2>${escapeHtml(copy.workflowTitle)}</h2>
      <p>${escapeHtml(copy.workflowDescription)}</p>
    </div>
    <div class="workflow-frame" role="img" aria-label="${escapeHtml(page.previewLabel)}">
      ${renderWorkflowTerminal(page)}
    </div>
  </section>`;

const renderPrinciples = (copy) => `
  <section class="product-section principles-section" id="principles">
    ${renderSectionHeading(copy.principlesLabel, copy.principlesTitle)}
    <div class="principle-grid">
      ${copy.principles
        .map(
          (item) => `
        <article class="principle-card">
          <span class="principle-token" aria-hidden="true">${escapeHtml(item.token)}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
        </article>`,
        )
        .join("")}
    </div>
  </section>`;

const renderCapabilities = (copy) => `
  <section class="product-section capabilities-section" id="capabilities">
    ${renderSectionHeading(copy.capabilitiesLabel, copy.capabilitiesTitle)}
    <div class="capability-list">
      ${copy.capabilities
        .map(
          (item) => `
        <article class="capability-row">
          <div class="capability-copy">
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.description)}</p>
            <ul>
              ${item.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
            </ul>
          </div>
          ${renderCommandPanel(item.command, item.output)}
        </article>`,
        )
        .join("")}
    </div>
  </section>`;

const taglineLocaleTags = { ko: "ko", en: "en", jp: "ja", cn: "zh-CN" };

// Segment per locale so CJK copy still reveals word by word, then glue
// trailing punctuation onto the word before it.
const renderTaglineLine = (line, locale) => {
  const segmenter = new Intl.Segmenter(taglineLocaleTags[locale], {
    granularity: "word",
  });
  const tokens = [];

  for (const { segment, isWordLike } of segmenter.segment(line)) {
    if (/^\s+$/.test(segment)) {
      tokens.push(null);
    } else if (isWordLike || tokens.length === 0 || tokens.at(-1) === null) {
      tokens.push(segment);
    } else {
      tokens[tokens.length - 1] += segment;
    }
  }

  return tokens
    .map((token) =>
      token === null
        ? " "
        : `<span class="tagline-word">${escapeHtml(token)}</span>`,
    )
    .join("");
};

const renderHomeTagline = (copy, locale) => `
  <section class="product-section tagline-section" id="tagline" data-tagline aria-labelledby="tagline-text">
    <p class="tagline-text" id="tagline-text">
      ${copy.tagline
        .split("\n")
        .map(
          (line) =>
            `<span class="tagline-line">${renderTaglineLine(line, locale)}</span>`,
        )
        .join("\n      ")}
    </p>
  </section>`;

const agentSkillInstallCommand =
  "npx skills add channprj/kmsg --skill kmsg --agent claude-code codex -g -y";

const renderAgentSkill = (page, copy) => `
  <section class="product-section agent-skill-section" id="agent-skill" data-agent-skill>
    ${renderSectionHeading(
      copy.agentSkillLabel,
      copy.agentSkillTitle,
      copy.agentSkillDescription,
    )}
    <div class="agent-skill-grid">
      <article class="agent-skill-card">
        <span class="agent-skill-step">01</span>
        <h3>${escapeHtml(copy.agentSkillInstallTitle)}</h3>
        <p>${escapeHtml(copy.agentSkillInstallDescription)}</p>
        <button class="agent-skill-command copy-control" type="button" aria-label="${escapeHtml(`${page.localeConfig.ui.copy}: ${agentSkillInstallCommand}`)}" aria-live="polite" translate="no" data-copy="${agentSkillInstallCommand}" data-copied-label="${page.localeConfig.ui.copied}" data-copy-failed-label="${page.localeConfig.ui.copyFailed}">
          <span class="prompt" aria-hidden="true">$</span>
          <code translate="no">${agentSkillInstallCommand}</code>
          ${renderCopyIcons()}
        </button>
      </article>
      <article class="agent-skill-card">
        <span class="agent-skill-step">02</span>
        <h3>${escapeHtml(copy.agentSkillUseTitle)}</h3>
        <p>${escapeHtml(copy.agentSkillUseDescription)}</p>
        <div class="agent-invocation-grid">
          <article class="agent-invocation">
            <span>Claude Code</span>
            <code translate="no">/kmsg</code>
          </article>
          <article class="agent-invocation">
            <span>Codex</span>
            <code translate="no">$kmsg</code>
          </article>
        </div>
        <div class="agent-prompt-example">
          <span>prompt</span>
          <code translate="no">${escapeHtml(copy.agentSkillPrompt)}</code>
        </div>
      </article>
    </div>
  </section>`;

const storySearchTerms = [
  "kmsg 카카오톡",
  "kmsg 카톡",
  "kmsg 카카오",
];
const moreStoriesUrl =
  "https://www.google.com/search?q=%22kmsg+%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%86%A1%22+OR+%22kmsg+%EC%B9%B4%ED%86%A1%22+OR+%22kmsg+%EC%B9%B4%EC%B9%B4%EC%98%A4%22";

const renderHomeStories = (copy, locale) => `
  <section class="product-section stories-section" id="stories">
    ${renderSectionHeading(
      copy.storiesLabel,
      copy.storiesTitle,
      copy.storiesDescription,
    )}
    <div class="story-grid">
      ${homeStories
        .map(
          (story) => `
        <article class="story-card">
          <a class="story-media" href="${story.href}" target="_blank" rel="noopener noreferrer">
            <img src="${story.image}" alt="${escapeHtml(story.title[locale])}" width="640" height="360" loading="lazy" decoding="async">
          </a>
          <div class="story-copy">
            <span class="story-publisher">${escapeHtml(story.publisher)}</span>
            <h3><a href="${story.href}" target="_blank" rel="noopener noreferrer">${escapeHtml(story.title[locale])}</a></h3>
            <span class="story-arrow" aria-hidden="true">${renderIcon("external-link")}</span>
          </div>
        </article>`,
        )
        .join("")}
    </div>
    <div class="section-action">
      <a class="story-search-action" href="${moreStoriesUrl}" target="_blank" rel="noopener noreferrer">
        <span class="story-search-title">
          ${renderIcon("search")}
          <span>${escapeHtml(copy.moreStoriesAction)}</span>
          ${renderIcon("external-link")}
        </span>
        <span class="story-search-terms" translate="no">
          ${storySearchTerms
            .map(
              (term) =>
                `<span class="story-search-term">${escapeHtml(term)}</span>`,
            )
            .join("")}
        </span>
      </a>
    </div>
  </section>`;

const renderHomeFaq = (copy, faqs) => `
  <section class="product-section faq-section" id="faq">
    ${renderSectionHeading(
      copy.faqLabel,
      copy.faqTitle,
      copy.faqDescription,
    )}
    <div class="faq-list">
      ${faqs
        .map(
          ({ question, answer }) => `
        <details class="faq-item">
          <summary>${escapeHtml(question)}<span class="faq-icons" aria-hidden="true">${renderIcon("plus")}${renderIcon("minus")}</span></summary>
          <p>${escapeHtml(answer)}</p>
        </details>`,
        )
        .join("")}
    </div>
  </section>`;

const renderHomeInstall = (page, copy) => {
  const usageLink = relativeAsset(
    page.output,
    localizedPage(page.locale, "usage").output,
  );

  return `
    <section class="product-section install-section" id="install">
      <div class="install-panel">
        <p class="section-label">${escapeHtml(copy.installLabel)}</p>
        <h2>${escapeHtml(copy.installTitle)}</h2>
        <p class="install-description">${escapeHtml(copy.installDescription)}</p>
        <button class="install-command copy-control" type="button" aria-label="${escapeHtml(`${page.localeConfig.ui.copy}: brew install channprj/tap/kmsg`)}" aria-live="polite" translate="no" data-copy="brew install channprj/tap/kmsg" data-copied-label="${page.localeConfig.ui.copied}" data-copy-failed-label="${page.localeConfig.ui.copyFailed}">
          <span class="prompt" aria-hidden="true">$</span>
          <code translate="no">brew install channprj/tap/kmsg</code>
          ${renderCopyIcons()}
        </button>
        <ul class="requirement-list" aria-label="${escapeHtml(copy.installDescription)}">
          <li>macOS 13+</li>
          <li>KakaoTalk for macOS</li>
          <li>Accessibility</li>
        </ul>
        <div class="install-links">
          <a href="${usageLink}">${escapeHtml(copy.docsAction)} ${renderIcon("arrow-right", 18)}</a>
          <a href="${site.releasesUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(copy.releaseAction)} ${renderIcon("external-link", 18)}</a>
        </div>
        <small>${escapeHtml(copy.disclaimer)}</small>
      </div>
    </section>`;
};

const renderHomeHeadline = (copy) => {
  if (!copy.headlineHighlight) {
    return escapeHtml(copy.headline);
  }

  return copy.headline
    .split("\n")
    .map((line) => {
      const highlightIndex = line.indexOf(copy.headlineHighlight);

      if (highlightIndex === -1) {
        return `<span class="hero-title-line">${escapeHtml(line)}</span>`;
      }

      const before = line.slice(0, highlightIndex);
      const after = line.slice(highlightIndex + copy.headlineHighlight.length);

      return `<span class="hero-title-line">${escapeHtml(before)}<mark class="hero-highlight">${escapeHtml(copy.headlineHighlight)}</mark>${escapeHtml(after)}</span>`;
    })
    .join("\n");
};

const renderProductHome = (page, faqs) => {
  const copy = homeContent[page.locale];
  const docsLink = relativeAsset(
    page.output,
    localizedPage(page.locale, "usage").output,
  );

  if (!copy) {
    throw new Error(
      `Missing product homepage content for locale: ${page.locale}`,
    );
  }

  return `
    <section class="product-hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <div class="product-mark">
          <img src="${relativeAsset(page.output, site.imagePath)}" alt="" width="64" height="64" fetchpriority="high" decoding="async">
        </div>
        <p class="hero-kicker">${escapeHtml(copy.kicker)}</p>
        <h1 id="hero-title">${renderHomeHeadline(copy)}</h1>
        <p class="hero-lead">${escapeHtml(copy.description)}</p>
        <div class="hero-actions">
          <a class="button button-primary" href="#install">${escapeHtml(copy.installAction)}</a>
          <a class="hero-docs-link" href="${docsLink}">${escapeHtml(copy.docsAction)} ${renderIcon("arrow-right", 18)}</a>
        </div>
        <ul class="hero-proof">
          ${copy.heroProof.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n          ")}
        </ul>
      </div>
      <figure class="hero-media">
        <img src="${relativeAsset(page.output, site.heroImagePath)}" alt="${escapeHtml(copy.heroImageAlt)}" width="1536" height="1024" fetchpriority="high" decoding="async">
      </figure>
    </section>
    ${renderHomeWorkflow(page, copy)}
    ${renderPrinciples(copy)}
    ${renderCapabilities(copy)}
    ${renderHomeTagline(copy, page.locale)}
    ${renderAgentSkill(page, copy)}
    ${renderHomeStories(copy, page.locale)}
    ${renderHomeFaq(copy, faqs)}
    ${renderHomeInstall(page, copy)}`;
};

const renderMarkdownArticle = (page, rendered) => `
  <article class="markdown-body" data-markdown-content>
    <div class="source-stamp">
      ${escapeHtml(page.sourceLabel ?? page.source)}
      <a href="${site.repositoryUrl}/blob/main/${page.source}" target="_blank" rel="noopener noreferrer">${escapeHtml(page.localeConfig.ui.sourceAction)} ${renderIcon("external-link", 16)}</a>
    </div>
    ${rendered.html}
  </article>`;

const renderDocsHero = (page, markdown, lastModified) => {
  const sourceTitle = markdown.match(/^#\s+(.+)$/m)?.[1] ?? page.title;
  const dateLabel = new Intl.DateTimeFormat(page.localeConfig.dateLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(lastModified));

  return `
    <section class="docs-hero" aria-labelledby="page-title">
      <p class="eyebrow"><span></span>${escapeHtml(page.eyebrow)}</p>
      <h1 id="page-title">${escapeHtml(sourceTitle)}</h1>
      <p>${escapeHtml(page.description)}</p>
      <div class="docs-meta">
        <span>${page.localeConfig.ui.pipeline}</span>
        <span>${page.localeConfig.ui.updated} ${escapeHtml(dateLabel)}</span>
        <a href="${site.repositoryUrl}/blob/main/${page.source}" target="_blank" rel="noopener noreferrer">${escapeHtml(page.localeConfig.ui.edit)} ${renderIcon("external-link", 16)}</a>
      </div>
    </section>`;
};

const renderFooter = (page, version) => {
  const architectureLink = relativeAsset(
    page.output,
    localizedPage(page.locale, "architecture").output,
  );
  const versioningLink = relativeAsset(
    page.output,
    localizedPage(page.locale, "versioning").output,
  );
  const llmLink = relativeAsset(page.output, "llm.txt");
  const versioningFooterLink =
    page.type === "home"
      ? ""
      : `<a href="${versioningLink}">v${escapeHtml(version)}</a>`;

  return `
    <footer class="site-footer">
      <div class="footer-brand">
        <img src="${relativeAsset(page.output, site.imagePath)}" alt="" width="56" height="56" loading="lazy" decoding="async">
        <div><strong translate="no">kmsg</strong><span>${page.localeConfig.ui.footerTagline}</span></div>
      </div>
      <div class="footer-links">
        <a href="${architectureLink}">${page.localeConfig.ui.architecture}</a>
        ${versioningFooterLink}
        <a class="footer-llm-link" href="${llmLink}" type="text/plain">LLM.txt</a>
        <a href="${site.licenseUrl}" target="_blank" rel="noopener noreferrer">MIT License</a>
      </div>
      <p>${page.localeConfig.ui.footerDisclaimer}</p>
    </footer>`;
};

const buildStructuredData = ({
  page,
  version,
  canonical,
  lastModified,
  faqs,
}) => {
  const productId = `${site.baseUrl}#software`;
  const authorId = `${site.baseUrl}#author`;
  const websiteId = `${site.baseUrl}#website`;
  const imageObject = {
    "@type": "ImageObject",
    url: pageUrl(site.imagePath),
    width: 1000,
    height: 1000,
  };
  const pageNode = {
    "@type": page.type === "docs" ? "TechArticle" : "WebPage",
    "@id": `${canonical}#webpage`,
    url: canonical,
    name: page.title,
    headline: page.title,
    description: page.description,
    inLanguage: page.lang,
    dateModified: lastModified,
    isPartOf: { "@id": websiteId },
    about: { "@id": productId },
    author: { "@id": authorId },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "kmsg",
          item: site.baseUrl,
        },
        ...(page.path
          ? [
              {
                "@type": "ListItem",
                position: 2,
                name: page.eyebrow.replace(/^.+ · /, ""),
                item: canonical,
              },
            ]
          : []),
      ],
    },
  };
  if (page.type === "home") {
    pageNode.mainEntity = { "@id": productId };
  }
  const graph = [
    {
      "@type": "Person",
      "@id": authorId,
      name: site.authorName,
      url: site.authorUrl,
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: site.baseUrl,
      name: "kmsg",
      description: page.description,
      inLanguage: localeOrder.map((localeId) => locales[localeId].lang),
      publisher: { "@id": authorId },
    },
    {
      "@type": "SoftwareApplication",
      "@id": productId,
      name: "kmsg",
      alternateName: "KakaoTalk CLI for macOS",
      description:
        "Unofficial KakaoTalk CLI and native MCP server for reading, watching, and sending messages on macOS.",
      url: site.baseUrl,
      applicationCategory: "DeveloperApplication",
      applicationSubCategory: "Command-line interface",
      operatingSystem: "macOS 13 or later",
      softwareVersion: version,
      downloadUrl: site.releasesUrl,
      installUrl: `${site.baseUrl}usage/#homebrew`,
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      author: { "@id": authorId },
      license: site.licenseUrl,
      sameAs: [site.repositoryUrl],
      image: imageObject,
      featureList: [
        "List KakaoTalk chats",
        "Read recent messages",
        "Watch new messages",
        "Send text and images",
        "Native stdio MCP server",
      ],
      softwareRequirements:
        "macOS 13 or later; KakaoTalk for macOS; Accessibility permission",
      inLanguage: localeOrder.map((localeId) => locales[localeId].lang),
    },
    {
      "@type": "SoftwareSourceCode",
      name: "kmsg",
      description: page.description,
      codeRepository: site.repositoryUrl,
      programmingLanguage: "Swift",
      runtimePlatform: "macOS 13 or later",
      version: version,
      license: site.licenseUrl,
      author: { "@id": authorId },
      isPartOf: { "@id": productId },
    },
    pageNode,
  ];

  if (faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${canonical}#faq`,
      mainEntity: faqs.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: {
          "@type": "Answer",
          text: answer,
        },
      })),
    });
  }

  return JSON.stringify(
    { "@context": "https://schema.org", "@graph": graph },
    null,
    2,
  ).replaceAll("<", "\\u003c");
};

const renderDocument = ({
  page,
  markdown,
  rendered,
  intro,
  version,
  faqs,
  lastModified,
}) => {
  const canonical = pageUrl(page.path);
  const rootAsset = (target) => relativeAsset(page.output, target);
  const alternateLinks = localeOrder
    .map((localeId) => {
      const locale = locales[localeId];
      const target = localizedPage(localeId, page.pageKey);
      return `<link rel="alternate" hreflang="${locale.hrefLang}" href="${pageUrl(target.path)}">`;
    })
    .join("\n    ");
  const alternateOgLocales = localeOrder
    .filter((localeId) => localeId !== page.locale)
    .map(
      (localeId) =>
        `<meta property="og:locale:alternate" content="${locales[localeId].ogLocale}">`,
    )
    .join("\n    ");
  const xDefault = pageUrl(localizedPage("ko", page.pageKey).path);
  const localeTargets = Object.fromEntries(
    localeOrder.map((localeId) => [
      localeId,
      pageUrl(localizedPage(localeId, page.pageKey).path),
    ]),
  );
  const structuredData = buildStructuredData({
    page,
    version,
    canonical,
    lastModified,
    faqs,
  });
  const mainContent =
    page.type === "home"
      ? `<div class="product-home" data-product-home>
          ${renderProductHome(page, faqs)}
        </div>`
      : `${renderDocsHero(page, markdown, lastModified)}
        <div class="content-layout">
          ${renderToc(rendered.headings, page)}
          ${renderMarkdownArticle(page, rendered)}
        </div>`;
  const heroPreload =
    page.type === "home"
      ? `<link rel="preload" as="image" href="${rootAsset(site.heroImagePath)}" type="image/webp" fetchpriority="high">`
      : "";

  const html = `<!doctype html>
<html lang="${page.lang}" data-locale="${page.locale}" data-page-key="${page.pageKey}" data-theme="dark">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}">
    <meta name="author" content="${site.authorName}">
    <meta name="application-name" content="kmsg">
    <meta name="generator" content="kmsg README site generator">
    <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
    <meta name="googlebot" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
    <meta name="theme-color" content="#0c0d0b">
    <link rel="canonical" href="${canonical}">
    ${alternateLinks}
    <link rel="alternate" hreflang="x-default" href="${xDefault}">
    <link rel="alternate" type="text/markdown" href="${site.repositoryUrl}/raw/main/${page.source}" title="${escapeHtml(page.source)}">
    <link rel="alternate" type="text/plain" href="${pageUrl("llm.txt")}" title="LLM-readable site index">
    <link rel="manifest" href="${rootAsset("site.webmanifest")}">
    <link rel="icon" href="${rootAsset("assets/favicon.svg")}" type="image/svg+xml">
    ${heroPreload}
    <link rel="stylesheet" href="${rootAsset("assets/styles.css")}">

    <meta property="og:type" content="${page.type === "docs" ? "article" : "website"}">
    <meta property="og:site_name" content="kmsg">
    <meta property="og:title" content="${escapeHtml(page.title)}">
    <meta property="og:description" content="${escapeHtml(page.description)}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${pageUrl(site.imagePath)}">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:width" content="1000">
    <meta property="og:image:height" content="1000">
    <meta property="og:image:alt" content="kmsg KakaoTalk CLI logo">
    <meta property="og:locale" content="${page.localeConfig.ogLocale}">
    ${alternateOgLocales}
    ${page.type === "docs" ? `<meta property="article:modified_time" content="${lastModified}">` : ""}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(page.title)}">
    <meta name="twitter:description" content="${escapeHtml(page.description)}">
    <meta name="twitter:image" content="${pageUrl(site.imagePath)}">
    <meta name="twitter:image:alt" content="kmsg KakaoTalk CLI logo">

    <script type="application/ld+json">${structuredData}</script>
    <script>
      try {
        const savedTheme = localStorage.getItem("kmsg-theme");
        document.documentElement.dataset.theme =
          savedTheme ||
          (matchMedia("(prefers-color-scheme: light)").matches
            ? "paper"
            : "dark");
        const currentLocale = ${JSON.stringify(page.locale)};
        const savedLocale = localStorage.getItem("kmsg-locale");
        const localeTargets = ${JSON.stringify(localeTargets).replaceAll("<", "\\u003c")};
        if (
          currentLocale === "ko" &&
          savedLocale &&
          savedLocale !== "ko" &&
          localeTargets[savedLocale]
        ) {
          location.replace(localeTargets[savedLocale] + location.hash);
        } else {
          localStorage.setItem("kmsg-locale", currentLocale);
        }
      } catch {}
    </script>
  </head>
  <body class="${page.type === "home" ? "is-home" : "is-docs"}" data-source="${escapeHtml(page.source)}" data-locale="${page.locale}" data-copy-label="${page.localeConfig.ui.copy}" data-copied-label="${page.localeConfig.ui.copied}" data-copy-failed-label="${page.localeConfig.ui.copyFailed}">
    <a class="skip-link" href="#content">${page.localeConfig.ui.skip}</a>
    <div class="site-shell">
      ${renderHeader(page)}
      <main id="content">
        ${mainContent}
      </main>
      ${renderFooter(page, version)}
    </div>
    <script src="${rootAsset("assets/app.js")}" defer></script>
  </body>
</html>`;

  return html.replaceAll("—", "-").replaceAll("–", "-");
};

const buildLlmsIndex = (version) => {
  const links = pages
    .map(
      ({ path, title, description }) =>
        `- [${title}](${pageUrl(path)}): ${description}`,
    )
    .join("\n");

  return `# kmsg

> kmsg is an unofficial KakaoTalk CLI and native MCP server for macOS. It reads, watches, and sends messages through Apple's Accessibility API for local automation and AI agents.

Current version: ${version}
Canonical website: ${site.baseUrl}
Source repository: ${site.repositoryUrl}
License: MIT

## Documentation

${links}

## Primary facts

- Platform: macOS 13 or later
- Runtime dependency: KakaoTalk for macOS
- Implementation: Swift 6
- Interface: CLI, structured JSON, hooks, and native stdio MCP server
- Access method: macOS Accessibility API; kmsg does not implement the private LOCO protocol
- Install: \`brew install channprj/tap/kmsg\`
- Affiliation: Independent open source; not affiliated with Kakao Corp.

## Optional

- [Korean documentation](${site.baseUrl}): 한국어 프로젝트 소개, 설치 방법, 주요 기능, FAQ
- [English documentation](${pageUrl("en/")}): English project overview, installation, highlights, and FAQ
- [Japanese documentation](${pageUrl("jp/")}): 日本語の概要、インストール、コマンド、MCPガイド
- [Simplified Chinese documentation](${pageUrl("cn/")}): 简体中文概览、安装、命令和MCP指南
- [Full Markdown corpus](${pageUrl("llms-full.txt")}): README and project documentation combined as plain Markdown
`;
};

const buildLlmsFull = (documents, version) => {
  const sections = documents
    .map(
      ({ page, markdown }) =>
        `# Source: ${page.source}\nCanonical URL: ${pageUrl(page.path)}\n\n${markdown.trim()}`,
    )
    .join("\n\n---\n\n");

  return `# kmsg documentation corpus

Version: ${version}
Repository: ${site.repositoryUrl}
Generated automatically from the repository Markdown sources.

---

${sections}
`;
};

const buildSitemap = (documents) => {
  const entries = documents
    .map(
      ({ page, lastModified }) => `  <url>
    <loc>${pageUrl(page.path)}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>${page.type === "home" ? "weekly" : "monthly"}</changefreq>
    <priority>${page.type === "home" ? "1.0" : "0.8"}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
};

const buildRedirect = (target, lang = "ko") =>
  `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">` +
  `<meta http-equiv="refresh" content="0; url=${target}">` +
  `<link rel="canonical" href="${target}">` +
  `<meta name="robots" content="noindex,follow"></head>` +
  `<body><p><a href="${target}">kmsg 문서로 이동</a></p></body></html>`;

const main = async () => {
  const version = (await readFile(join(repoDir, "VERSION"), "utf8")).trim();
  const documents = await Promise.all(
    pages.map(async (page) => {
      const markdown = await readFile(join(repoDir, page.source), "utf8");
      return {
        page,
        markdown,
        rendered: renderMarkdown(markdown, page),
        intro: extractIntro(markdown),
        faqs: extractFaqs(markdown, page),
        lastModified: gitLastModified(page.source, page.canonicalSource),
      };
    }),
  );

  await rm(outputDir, { recursive: true, force: true });
  await mkdir(join(outputDir, "assets"), { recursive: true });

  for (const document of documents) {
    const outputPath = join(outputDir, document.page.output);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(
      outputPath,
      renderDocument({ ...document, version }),
      "utf8",
    );
  }

  await mkdir(join(outputDir, "ko"), { recursive: true });
  await writeFile(
    join(outputDir, "ko/index.html"),
    buildRedirect(site.baseUrl),
    "utf8",
  );
  for (const pageKey of [
    "usage",
    "architecture",
    "openclaw",
    "skill",
    "versioning",
  ]) {
    const koreanPage = localizedPage("ko", pageKey);
    const legacyOutput = join(outputDir, "ko", koreanPage.output);
    await mkdir(dirname(legacyOutput), { recursive: true });
    await writeFile(
      legacyOutput,
      buildRedirect(pageUrl(koreanPage.path)),
      "utf8",
    );
  }
  for (const localeId of localeOrder) {
    const locale = locales[localeId];
    const mcpPage = localizedPage(localeId, "openclaw");
    const legacyOutput = join(
      outputDir,
      locale.prefix,
      "openclaw",
      "index.html",
    );
    await mkdir(dirname(legacyOutput), { recursive: true });
    await writeFile(
      legacyOutput,
      buildRedirect(pageUrl(mcpPage.path), locale.lang),
      "utf8",
    );
  }
  await mkdir(join(outputDir, "ko", "openclaw"), { recursive: true });
  await writeFile(
    join(outputDir, "ko", "openclaw", "index.html"),
    buildRedirect(pageUrl(localizedPage("ko", "openclaw").path)),
    "utf8",
  );

  const llmsIndex = buildLlmsIndex(version);

  await Promise.all([
    copyFile(join(siteDir, "src/styles.css"), join(outputDir, "assets/styles.css")),
    copyFile(join(siteDir, "src/app.js"), join(outputDir, "assets/app.js")),
    copyFile(join(siteDir, "src/favicon.svg"), join(outputDir, "assets/favicon.svg")),
    copyFile(join(siteDir, "src/demo-captions.vtt"), join(outputDir, "assets/demo-captions.vtt")),
    copyFile(join(siteDir, "src/kmsg-workspace.webp"), join(outputDir, site.heroImagePath)),
    copyFile(join(repoDir, site.imagePath), join(outputDir, site.imagePath)),
    copyFile(join(repoDir, "assets/demo1.mp4"), join(outputDir, "assets/demo1.mp4")),
    writeFile(join(outputDir, ".nojekyll"), "", "utf8"),
    writeFile(
      join(outputDir, "robots.txt"),
      `User-agent: *\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nUser-agent: ChatGPT-User\nAllow: /\n\nSitemap: ${pageUrl("sitemap.xml")}\n`,
      "utf8",
    ),
    writeFile(join(outputDir, "sitemap.xml"), buildSitemap(documents), "utf8"),
    writeFile(join(outputDir, "llm.txt"), llmsIndex, "utf8"),
    writeFile(join(outputDir, "llms.txt"), llmsIndex, "utf8"),
    writeFile(
      join(outputDir, "llms-full.txt"),
      buildLlmsFull(documents, version),
      "utf8",
    ),
    writeFile(
      join(outputDir, "site.webmanifest"),
      JSON.stringify(
        {
          name: "kmsg — KakaoTalk CLI for macOS",
          short_name: "kmsg",
          description: pages[0].description,
          start_url: "/kmsg/",
          display: "standalone",
          background_color: "#0c0d0b",
          theme_color: "#fee500",
          icons: [
            {
              src: "assets/kmsg-logo.jpg",
              sizes: "1000x1000",
              type: "image/jpeg",
              purpose: "any",
            },
          ],
        },
        null,
        2,
      ),
      "utf8",
    ),
    writeFile(
      join(outputDir, "404.html"),
      `<!doctype html><meta charset="utf-8"><title>kmsg</title><meta http-equiv="refresh" content="0; url=${site.baseUrl}"><link rel="canonical" href="${site.baseUrl}"><p><a href="${site.baseUrl}">Continue to kmsg</a></p>`,
      "utf8",
    ),
  ]);

  console.log(
    `Built ${documents.length} pages and discovery files in ${relative(repoDir, outputDir)}`,
  );
};

await main();
