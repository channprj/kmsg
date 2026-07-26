# kmsgの使い方

このページでは、インストールからメッセージの読み取り・送信、MCPサーバー、トラブルシューティングまでの主要な操作を説明します。全オプションは[英語版リファレンス](https://github.com/channprj/kmsg/blob/main/USAGE.md)で確認できます。

## インストール

### 必要な環境

- macOS 13以降
- macOS版KakaoTalk
- 実際に実行する`kmsg`バイナリへのアクセシビリティ権限

### Homebrew

```bash
brew install channprj/tap/kmsg
```

アップデート:

```bash
brew update
brew upgrade kmsg
```

### ソースからビルド

```bash
git clone https://github.com/channprj/kmsg.git
cd kmsg
swift build -c release
install -m 755 .build/release/kmsg ~/.local/bin/kmsg
```

## クイックスタート

最初に権限とKakaoTalkの状態を確認します。

```bash
kmsg status --verbose
```

チャット一覧を取得し、最近のメッセージを読みます。

```bash
kmsg chats --limit 20
kmsg read "チャット名" --limit 20
```

送信前に対象と内容を確認します。

```bash
kmsg send "チャット名" "こんにちは" --dry-run
```

`--dry-run`はKakaoTalk UIへアクセスする前に終了するため、メッセージを送信しません。

## ログインと権限

```bash
kmsg auth login
kmsg auth login --auto
```

パスワードはAES-GCMで暗号化され、認証情報と鍵は所有者だけが読める別々のファイルに保存されます。これらのファイルを公開しないでください。

```text
~/.config/kmsg/credentials.json
~/.config/kmsg/credentials/primary.key
```

## コマンド一覧

| コマンド | 用途 |
|---|---|
| `kmsg status` | 権限、KakaoTalk、ログイン、準備状態を確認 |
| `kmsg auth login` | 認証情報を入力または再利用 |
| `kmsg chats` | チャット一覧とローカル`chat_id`を取得 |
| `kmsg read` | 最近のメッセージを読み取る |
| `kmsg watch` | 新着メッセージを継続監視 |
| `kmsg send` | テキストメッセージを送信 |
| `kmsg send-image` | 画像を送信 |
| `kmsg inspect` | AX階層を調査 |
| `kmsg cache` | AXパスキャッシュを管理 |
| `kmsg mcp-server` | ネイティブstdio MCPサーバーを起動 |

## 安全な読み取り

前面での作業を妨げたくない場合は`--background-safe`を使います。

```bash
kmsg read "チャット名" --json --background-safe
```

このモードはKakaoTalkの起動・アクティブ化・ログイン・検索・ウィンドウ操作を行いません。対象のチャットウィンドウがすでに表示されていなければ失敗します。

## 送信

```bash
kmsg send <recipient> <message> [options]
kmsg send --chat-id <chat-id> <message> [options]
```

| オプション | 動作 |
|---|---|
| `--dry-run` | UIを操作せず、対象と内容だけを表示 |
| `--chat-id ID` | `kmsg chats`が生成したローカルIDを利用 |
| `--keep-window` | コマンドが開いたチャットを維持 |
| `--no-cache` | 関連AXキャッシュを破棄して再探索 |
| `--layout MODE` | ウィンドウ配置を指定 |

画像送信:

```bash
kmsg send-image "チャット名" /absolute/path/image.png --dry-run
```

## JSONとMCP

```bash
kmsg chats --json
kmsg read "チャット名" --json
kmsg watch "チャット名" --json
```

構造化結果は`stdout`、AX診断は`stderr`に出力されます。

MCPサーバーは次のツールを公開します。

| ツール | 用途 |
|---|---|
| `kmsg_read` | 最近のメッセージを読み取る |
| `kmsg_send` | テキストを送信 |
| `kmsg_send_image` | ローカル画像を送信 |

送信ツールでは、`confirm=true`は送信せず`CONFIRMATION_REQUIRED`を返します。`confirm=false`または省略時は即時送信です。

## 主な環境変数

| 変数 | 既定値 | 説明 |
|---|---|---|
| `KMSG_MCP_KMSG_PATH` | 現在の実行ファイル | MCPサーバーが呼び出すパス |
| `KMSG_MCP_TIMEOUT_SECONDS` | `30` | サブプロセスの制限時間 |
| `KMSG_DEFAULT_LAYOUT` | `preserve` | 既定のウィンドウ配置 |
| `KMSG_DEFAULT_BACKGROUND_SAFE` | `false` | 安全な読み取りの既定値 |
| `KMSG_DEFAULT_DEEP_RECOVERY` | `false` | 深い復旧の既定値 |

## トラブルシューティング

### アクセシビリティ権限がない

```bash
kmsg status
```

システム設定で、実際に実行しているバイナリを許可します。Homebrew版とローカルビルドは別のバイナリとして扱われる場合があります。

### チャットが見つからない

```bash
kmsg chats --verbose --limit 50
kmsg cache clear
kmsg read "正確なチャット名" --deep-recovery
```

繰り返し実行する自動化では、`kmsg chats`でレジストリを更新し`chat_id`を利用すると安定します。

### UI構造が変わった

```bash
kmsg read "チャット名" --debug --trace-ax
kmsg inspect --depth 5
kmsg cache stats
```

KakaoTalk更新後はキャッシュを消去して再探索してください。
