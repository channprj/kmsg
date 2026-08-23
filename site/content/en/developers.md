# kmsg developer resources

This first-party index explains how to integrate kmsg with scripts, local automation, coding agents, and MCP clients. The public interfaces are a macOS CLI, structured JSON output, a newline-delimited event stream, and a native stdio MCP server.

## CLI and structured JSON API

The [usage reference](../usage/) documents commands, options, environment variables, output formats, and troubleshooting. `kmsg chats`, `kmsg read`, and `kmsg watch` provide structured results while AX diagnostics remain on `stderr`. kmsg has no hosted HTTP API, REST endpoint, or OpenAPI specification; integrations invoke the installed binary as a local process.

## Authentication

Authentication means KakaoTalk desktop login readiness plus macOS Accessibility permission. `kmsg auth login` stores necessary credentials encrypted on the user's Mac. Non-interactive callers depend on previously stored credentials. There is no hosted OAuth flow, bearer token, cloud account, or remote auth endpoint.

## MCP server

The [MCP guide](../mcp/) documents `kmsg mcp-server`, a stdio server exposing `kmsg_read`, `kmsg_send`, and `kmsg_send_image`. Clients launch the installed binary and exchange JSON-RPC through standard input and output. kmsg currently has no first-party Streamable HTTP MCP endpoint or live `/.well-known/mcp` handshake; a static GitHub Pages response cannot represent a POST-based MCP session.

## Events and webhooks

Run `kmsg watch --json` as a local process for newline-delimited message events. kmsg does not operate a hosted webhook delivery or callback registration service. If a workflow needs webhooks, an operator-owned supervisor must validate local events, apply approval policy, and deliver them to an endpoint the operator controls.

## Source and architecture

The [architecture guide](../architecture/) covers the Accessibility wrapper, KakaoTalk services, command layer, cache, and MCP adapter. Source builds use Swift 6, and releases derive from the repository `VERSION` and tags. Changes that send messages must preserve dry-run or explicit confirmation boundaries.
