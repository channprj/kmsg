# kmsg開発者リソース

kmsgをscript、local automation、coding agent、MCP clientへ接続するためのfirst-party索引です。public interfaceはmacOS CLI、structured JSON、改行区切りevent stream、native stdio MCP serverです。

## CLIとauthentication

[利用ガイド](../usage/)にcommand、option、environment variable、JSON output、local credential、lock modeを掲載しています。kmsg authenticationはKakaoTalk desktop loginとmacOS Accessibility権限を確認するlocal flowです。hosted OAuth、bearer token、cloud accountはありません。

## MCP server

[MCPガイド](../mcp/)の`kmsg mcp-server`はstdio transportで`kmsg_read`、`kmsg_send`、`kmsg_send_image`を公開します。現在Streamable HTTP endpointやlive `/.well-known/mcp` handshakeはありません。static GitHub PagesでPOST based MCP sessionを装うことはしません。

## HTTP APIとwebhook

kmsgはhosted HTTP API、REST/OpenAPI specification、public webhook deliveryを提供しません。`kmsg watch --json`をlocal processとして実行するとmessage eventを受け取れます。webhookが必要な場合は利用者が管理するsupervisorでeventを検証し、approval policyを適用してから自分のendpointへ転送します。

## Sourceと設計

[Architecture](../architecture/)はAccessibility wrapper、domain service、command、cache、MCP adapterを説明します。source buildはSwift 6を利用し、送信変更ではdry-runまたは明示的confirmationを維持します。
