# kmsgのバージョン管理

`kmsg`は日付を含むバージョン形式を採用します。

```text
MAJOR.YYMMDD.PATCH_COUNT
```

例:

```text
1.260727.0
```

## 正式な値

リポジトリ直下の`VERSION`が唯一の正式な値です。ファイル内には先頭の`v`を付けません。

ビルド時にSwiftPMプラグインが形式を検証し、`BuildVersion`を生成します。`kmsg --version`、`kmsg status`、リリース成果物は同じ値を使います。

## 各フィールド

- `MAJOR`: 破壊的変更または大きな節目で増加
- `YYMMDD`: リリース日
- `PATCH_COUNT`: その日の最初は`0`、追加リリースごとに増加

Gitタグには`v`を付けます。

```text
v1.260727.0
```

## 運用ルール

- タグ作成前に`VERSION`を更新
- 新しい日付の最初のリリースは`PATCH_COUNT=0`
- 同日の追加リリースはpatch countだけを増加
- 日付が変わればpatch countを`0`へ戻す
- バイナリの報告値とタグが異なる場合、リリースを失敗させる

## バージョン更新

`VERSION`を手作業で編集せず、プロジェクトのコマンドを使います。

```bash
make release-patch
make release-major
```

変更前の確認:

```bash
scripts/headatever.sh patch --dry-run
```

自動化は、次のバージョン検証、`VERSION`更新、`chore(release): v<version>`コミット、注釈付きタグ作成を一つの流れとして実行します。

完全な手順は[英語版バージョン管理](https://github.com/channprj/kmsg/blob/main/VERSIONING.md)を参照してください。
