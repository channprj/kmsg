# kmsgアーキテクチャ

## 概要

`kmsg`はmacOS 13以降で動作するSwift 6実行ファイルです。KakaoTalkの非公開ネットワークプロトコルを実装せず、画面に表示されたmacOSアプリをアクセシビリティAPIで操作します。

```text
CLI commands
    ↓
KakaoTalk domain services
    ↓
Accessibility helpers + AX path cache
    ↓
AXUIElement / CGEvent / AppKit
    ↓
KakaoTalk for macOS
```

ネイティブstdio MCPサーバーは、同じ`kmsg`コマンドをサブプロセスとして実行し、結果を構造化して返します。CLIとMCPで自動化処理を重複実装しない設計です。

## 主なコンポーネント

| コンポーネント | 責務 |
|---|---|
| `Sources/kmsg/Commands/` | 引数解析、権限・認証、出力形式 |
| `UIElement` | `AXUIElement`ラッパーと制限付き探索 |
| `AXActionRunner` | フォーカス、入力、キーボード、再試行 |
| `AXPathCacheStore` | 検証済みAXパスの保存と無効化 |
| `KakaoTalkApp` | プロセスとウィンドウの起動・復旧 |
| `ChatListScanner` | チャット一覧とプレビューの取得 |
| `ChatIdentityRegistryStore` | ローカル`chat_id`の管理 |
| `ChatWindowResolver` | ウィンドウ再利用、検索、復旧 |
| `KakaoTalkTranscriptReader` | メッセージ行の正規化 |
| `KmsgMCPServer` | MCPフレーム、ツール、タイムアウト、エラー |

## データフロー

### 起動と認証

1. UIアクセスが必要なコマンドがアクセシビリティ権限を確認します。
2. 必要ならKakaoTalkを起動します。
3. ログイン状態を確認します。
4. 暗号化済み認証情報を利用するか、入力を求めます。

`read --background-safe`は自動起動・ログイン・前面UI操作を行いません。

### 読み取り

1. チャット名または`chat_id`から対象ウィンドウを解決します。
2. 入力欄、チャットパネル、メッセージ一覧を特定します。
3. 表示行を正規化されたメッセージレコードに変換します。
4. テキストまたは単一JSON文書として出力します。

### 監視

`watch`は開始時の履歴を基準線として扱い、その後に現れたメッセージのみを出力します。既存メッセージの再送を避けるため、信頼できる時刻がない行を開始直後に抑制することがあります。

### 送信

テキスト送信は入力欄へUnicode文字列を入力し、送信操作を検証します。画像送信はmacOS pasteboardを使い、KakaoTalkの確認UIを処理します。

## ローカル状態

| パス | 内容 |
|---|---|
| `~/.config/kmsg/credentials.json` | 暗号化された認証情報 |
| `~/.config/kmsg/credentials/primary.key` | ローカルAES-GCM鍵 |
| `~/.kmsg/ax-path-cache.json` | 検証済みAXパス |
| `~/.kmsg/chat-registry.json` | ローカルチャットID |

キャッシュはKakaoTalkのバージョン、ルート指紋、スキーマ、TTLを確認します。古いパスは破棄し、制限付き探索で復旧します。

## 設計判断

### 非公開プロトコルを使わない

KakaoTalkは公式のサードパーティ向けメッセージAPIを公開していません。`kmsg`はLOCOプロトコルをリバースエンジニアリングせず、ユーザーが実行中のアプリUIと対話します。これは公式連携や無リスクな利用を意味しません。

### macOSネイティブ

Swiftは`AppKit`、`ApplicationServices`、`AXUIElement`、`CGEvent`と直接連携できます。追加ランタイムなしの単一バイナリとして配布できます。

### 制限付き探索と自己修復

AX階層は高コストで、KakaoTalkの更新により変わる可能性があります。探索にはノード上限を設け、成功したパスを保存しつつ毎回再検証します。

### 出力チャネルの分離

構造化結果は`stdout`、AX診断は`stderr`へ出力します。JSON利用者やMCPサブプロセスがログをpayloadへ混ぜないための契約です。

詳細なディレクトリ構造と設計根拠は[英語版アーキテクチャ](https://github.com/channprj/kmsg/blob/main/ARCHITECTURE.md)を参照してください。
