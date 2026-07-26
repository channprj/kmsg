# OpenClaw連携ガイド

`kmsg`をOpenClawや他のMCPクライアントへ安全に接続する基本構成を説明します。

## 基本モデル

連携には2つの独立したインターフェースがあります。

- リクエスト／レスポンス: `kmsg mcp-server`
- リアルタイムイベント: `kmsg watch --json`

MCPサーバーは`kmsg_read`、`kmsg_send`、`kmsg_send_image`を提供します。`watch`はMCPツールではないため、リアルタイム自動応答にはイベントをOpenClawへ渡すsupervisorが必要です。

## 推奨構成

```text
kmsg watch --json
    ↓ one JSON object per event
supervisor / OpenClaw
    ↓ reasoning and approval
kmsg_send through MCP
```

長時間の監視ストリームと短いMCP呼び出しを分けることで、再起動やエラー処理を独立して管理できます。

## 事前確認

```bash
kmsg status --verbose
kmsg chats --limit 20
kmsg send "チャット名" "接続テスト" --dry-run
```

## MCP設定

```bash
kmsg mcp-server
```

クライアント設定例:

```json
{
  "mcpServers": {
    "kmsg": {
      "command": "/absolute/path/to/kmsg",
      "args": ["mcp-server"],
      "env": {
        "KMSG_MCP_TIMEOUT_SECONDS": "30",
        "KMSG_DEFAULT_LAYOUT": "preserve",
        "KMSG_DEFAULT_BACKGROUND_SAFE": "true"
      }
    }
  }
}
```

## リアルタイム監視

```bash
kmsg watch "チャット名" --json
```

イベントごとに1つのJSONを`stdout`へ出力し、診断ログは`stderr`へ分離します。supervisorは重複排除、再起動、承認ルールを担当します。

## ツール契約

### `kmsg_read`

```json
{
  "name": "kmsg_read",
  "arguments": {
    "chat": "チャット名",
    "limit": 20,
    "background_safe": true
  }
}
```

`background_safe=true`は、すでに表示されている一致ウィンドウだけを読みます。KakaoTalkの起動、アクティブ化、ログイン、検索、ウィンドウ操作は行いません。

### `kmsg_send`

```json
{
  "name": "kmsg_send",
  "arguments": {
    "chat": "チャット名",
    "message": "こんにちは",
    "confirm": true
  }
}
```

- `confirm=true`: 送信せず`CONFIRMATION_REQUIRED`を返す
- `confirm=false`または省略: 即時送信
- `dry_run=true`: UIを操作せず対象と内容を確認

### `kmsg_send_image`

```json
{
  "name": "kmsg_send_image",
  "arguments": {
    "chat": "チャット名",
    "image_path": "/absolute/path/image.png",
    "confirm": true
  }
}
```

## 運用モード

### 推奨: 下書き後に承認

1. `kmsg_read`またはwatchイベントで文脈を取得
2. AIエージェントが返信案を作成
3. 人またはポリシーエンジンが宛先と内容を確認
4. 承認済みの呼び出しだけを`confirm=false`で送信

個人チャットでは誤送信の影響が大きいため、この流れを推奨します。

### 完全自動応答

許可するチャット、送信頻度、再試行回数、最大文字数、禁止語、緊急停止をsupervisor側で制限した場合だけ使用してください。

## トラブルシューティング

- `command`には実行可能な`kmsg`の絶対パスを指定
- `kmsg status --verbose`で権限とKakaoTalk状態を確認
- background-safeで失敗する場合は対象チャットを先に表示
- 1つの接続内ではMCPフレーム方式を混在させない

全フィールドと応答例は[英語版OpenClawガイド](https://github.com/channprj/kmsg/blob/main/docs/openclaw.md)を参照してください。
