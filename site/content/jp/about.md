# kmsgについて

kmsgはmacOS版KakaoTalkをターミナルやAI agentから操作するための非公式オープンソースCLIおよびnative MCP serverです。公開されているmacOS Accessibility APIを使って表示中のアプリを操作し、非公開LOCO protocolは実装しません。

## 対象と運営

自分が管理するMacで作業を自動化する開発者、構造化JSONを利用するlocal tool、利用者の承認の下で動くAI agentを対象にしています。CHANNのPark Hee Chanが公開GitHub repository `channprj/kmsg`で保守し、source、issue、release、MIT License、CI履歴を確認できます。

## 信頼と技術的境界

KakaoTalkのaccount dataとmessageは利用者のMac上で処理され、この静的サイトへ送信されません。実際の送信前には`--dry-run`で対象とpayloadを確認してください。Accessibility権限、desktop login、background-safe read、暗号化されたlocal credential、明示的なMCP tool contractが操作範囲を定義します。

## 独立性

kmsgはKakao Corp.と提携または承認された公式製品ではありません。UI変更の影響を受ける可能性があり、利用者は権限、送信結果、関連policyを確認する責任があります。公式sourceとcanonical site、既知の制限を文書化し、確認できない保証は行いません。
