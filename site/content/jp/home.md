# kmsg — macOS向けKakaoTalk CLI / MCPサーバー

`kmsg`は、macOS向けの非公式KakaoTalk CLI兼ネイティブMCPサーバーです。macOSのアクセシビリティAPIを利用して、メッセージの読み取り・監視・送信を行い、ローカル自動化やAIエージェント向けに構造化データを出力します。

> **免責事項:** `kmsg`はKakao Corp.の公式ツールではありません。利用者は、自身のアカウントと環境に適用される法令、利用規約、組織のセキュリティポリシーを遵守する責任があります。

## 主な機能

- チャット一覧を取得し、再利用できるローカル`chat_id`を生成
- 最近のメッセージを読み取り、新着メッセージをリアルタイム監視
- 画面上のKakaoTalk UIを操作してテキストや画像を送信
- 構造化JSONを`stdout`へ、AX診断ログを`stderr`へ分離
- 読み取り・テキスト送信・画像送信に対応したネイティブstdio MCPサーバー
- background-safe読み取り、ウィンドウ配置、復旧モード、自己修復型AXパスキャッシュ

## 動作要件

- macOS 13以降
- [KakaoTalk for macOS](https://apps.apple.com/kr/app/kakaotalk/id869223134?mt=12)
- インストールした`kmsg`バイナリへのアクセシビリティ権限

## インストール

Homebrewでのインストールを推奨します。

```bash
brew install channprj/tap/kmsg
```

## クイックスタート

```bash
kmsg status
kmsg chats
kmsg read "チャット名" --limit 20
kmsg send "チャット名" "こんにちは" --dry-run
```

最後のコマンドはdry runです。対象と内容を表示するだけで、実際のメッセージは送信しません。

## ドキュメント

- [使い方](USAGE.md) — インストール、コマンド、設定、トラブルシューティング
- [アーキテクチャ](ARCHITECTURE.md) — コンポーネント、データフロー、設計判断
- [OpenClaw連携](docs/openclaw.md) — MCPとリアルタイム監視
- [バージョン管理](VERSIONING.md) — リリース形式と自動化

## よくある質問

### 公式のKakaoTalkツールですか？

いいえ。`kmsg`は独立して運営されるオープンソースプロジェクトであり、Kakao Corp.との提携、承認、保守関係はありません。

### KakaoTalkにはどのようにアクセスしますか？

AppleのmacOSアクセシビリティAPIを通じて、ユーザーが実行しているKakaoTalkアプリのUIを操作します。非公開のLOCOプロトコルは実装しません。

### MCPサーバーは含まれていますか？

はい。`kmsg mcp-server`は、MCP対応クライアントやAIエージェントに読み取り・テキスト送信・画像送信ツールを提供します。

### 対応OSは？

macOS 13以降のみです。Windows、Linux、Android、iOSには対応していません。

## ライセンス

`kmsg`は[MIT License](https://github.com/channprj/kmsg/blob/main/LICENSE)で提供されています。
