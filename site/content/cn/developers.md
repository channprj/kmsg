# kmsg开发者资源

本页汇集将kmsg接入script、local automation、coding agent与MCP client所需的first-party文档。public interface包括macOS CLI、structured JSON、按行输出的event stream，以及native stdio MCP server。

## CLI与authentication

[使用指南](../usage/)说明command、option、environment variable、JSON output、本地credential与lock mode。kmsg authentication是KakaoTalk desktop login加macOS Accessibility权限的local flow，不提供hosted OAuth、bearer token、cloud account或remote auth endpoint。

## MCP server

[MCP指南](../mcp/)中的`kmsg mcp-server`通过stdio transport公开`kmsg_read`、`kmsg_send`和`kmsg_send_image`。目前没有first-party Streamable HTTP endpoint或live `/.well-known/mcp` handshake；静态GitHub Pages不能代表POST based MCP session。

## HTTP API与webhook

kmsg不提供hosted HTTP API、REST/OpenAPI specification或public webhook delivery。运行local process `kmsg watch --json`可获得message event。如果workflow需要webhook，用户管理的supervisor应验证event、执行approval policy，然后发送到用户控制的endpoint。

## Source与架构

[Architecture](../architecture/)说明Accessibility wrapper、domain service、command layer、cache与MCP adapter。source build使用Swift 6，任何发送相关变更都应保留dry-run或明确confirmation边界。
