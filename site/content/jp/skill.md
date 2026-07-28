# kmsgコーディングエージェントSkill

`kmsg` Skillは、Claude CodeとCodexがmacOS版KakaoTalkを同じ安全な手順で
探し、読み取り、送信できるように案内します。

## 必要な環境

- macOS 13以降
- ログイン済みのmacOS版KakaoTalk
- インストール済みの`kmsg`バイナリに対するアクセシビリティ権限

## Skillのインストール

```bash
npx skills add channprj/kmsg --skill kmsg --agent claude-code codex -g -y
```

## エージェントから呼び出す

| エージェント | 呼び出し |
|---|---|
| Claude Code | `/kmsg` |
| Codex | `$kmsg` |

## 安全な基本フロー

1. `kmsg status --verbose`で権限とログイン状態を確認します。
2. `kmsg chats --limit 20`で正確なチャット名を確認します。
3. `kmsg read "チャット名" --limit 20`で最近のメッセージを読み取ります。
4. 送信前に`kmsg send "チャット名" "メッセージ" --dry-run`を実行します。

## MCPと組み合わせる

長時間のイベントには`kmsg watch --json`、リクエスト・レスポンス型の
ツールには`kmsg mcp-server`を使います。設定方法は
[MCPドキュメント](../mcp/)を参照してください。

## トラブルシューティング

コマンドが失敗したら、まず`kmsg status --verbose`と
`kmsg inspect --depth 5`を確認してください。全オプションは
[使い方](../usage/)を参照してください。
