# kmsg 개발자 리소스

이 페이지는 kmsg를 script, local automation, coding agent 또는 MCP client에 연결할 때 필요한 first-party 문서를 예측 가능한 한곳에 모읍니다. kmsg의 public interface는 macOS에서 실행되는 CLI, structured JSON output, newline event stream, native stdio MCP server입니다.

## CLI와 structured JSON API

[사용법 문서](../usage/)는 command, option, environment variable, output format과 troubleshooting을 다룹니다. `kmsg chats`, `kmsg read`, `kmsg watch`는 structured JSON을 제공하고 진단용 AX trace는 `stderr`로 분리합니다. kmsg는 hosted HTTP API나 REST OpenAPI specification을 제공하지 않습니다. 따라서 API key를 발급하거나 network endpoint에 request를 보내는 방식이 아니라 설치한 binary를 local process로 호출해야 합니다.

## Authentication 문서

kmsg authentication은 KakaoTalk desktop login과 macOS Accessibility permission을 확인하는 local flow입니다. `kmsg auth login`은 필요한 credential을 사용자의 Mac에 암호화해 저장하며, terminal이 없는 caller는 이미 저장된 credential에 의존합니다. hosted OAuth, bearer token, cloud account 또는 remote authentication endpoint는 없습니다. 상세한 lock-mode와 non-interactive 동작은 usage 문서의 authentication 절을 따릅니다.

## MCP server

[MCP 문서](../mcp/)에 있는 `kmsg mcp-server` command는 stdio transport로 `kmsg_read`, `kmsg_send`, `kmsg_send_image` tool을 노출합니다. MCP client는 installed binary를 command로 실행하고 JSON-RPC를 standard input/output으로 교환합니다. 현재 first-party Streamable HTTP MCP endpoint나 `/.well-known/mcp` live handshake는 제공하지 않습니다. GitHub Pages는 static host이므로 POST 기반 MCP session을 가장하지 않습니다.

## Events와 webhooks

실시간 message event는 `kmsg watch --json`을 별도 local process로 실행해 한 줄당 JSON object로 받습니다. kmsg는 public webhook delivery service나 callback registration API를 운영하지 않습니다. 외부 workflow가 webhook을 필요로 하면 사용자가 관리하는 supervisor가 local watch event를 검증하고 승인 정책을 적용한 뒤 자신의 endpoint로 전달해야 합니다. repository에는 제3자 webhook credential을 저장하지 마세요.

## Source, architecture와 변경 계약

[Architecture](../architecture/)는 Accessibility wrapper, KakaoTalk domain service, command layer, cache와 MCP adapter의 경계를 설명합니다. source build는 Swift 6을 사용하며 release version은 repository `VERSION`과 tag로 관리합니다. contribution 전에는 current issue, tests, release policy를 확인하고 message send처럼 외부 상태를 바꾸는 변경에는 dry-run 또는 explicit confirmation 경계를 유지하세요.
