# kmsg — 面向macOS的KakaoTalk CLI与MCP服务器

`kmsg`是一款非官方的KakaoTalk CLI和原生MCP服务器，适用于macOS。它通过macOS辅助功能API读取、监控和发送消息，并为本地自动化及AI智能体提供结构化输出。

> **免责声明：** `kmsg`并非Kakao Corp.官方工具。使用者有责任在自己的账户和环境中遵守适用法律、服务条款及组织安全政策。

## 核心功能

- 列出聊天并生成可复用的本地`chat_id`
- 读取最近消息，实时监控新消息
- 操作屏幕上可见的KakaoTalk UI，发送文本和图片
- 将结构化JSON输出到`stdout`，将AX诊断日志保留在`stderr`
- 提供读取、文本发送和图片发送工具的原生stdio MCP服务器
- 支持background-safe读取、窗口布局、恢复模式和自修复AX路径缓存

## 系统要求

- macOS 13或更高版本
- [KakaoTalk for macOS](https://apps.apple.com/kr/app/kakaotalk/id869223134?mt=12)
- 为实际安装的`kmsg`二进制授予辅助功能权限

## 安装

推荐使用Homebrew安装。

```bash
brew install channprj/tap/kmsg
```

## 快速开始

```bash
kmsg status
kmsg chats
kmsg read "聊天名称" --limit 20
kmsg send "聊天名称" "你好" --dry-run
```

最后一条命令是dry run，只显示收件目标与消息内容，不会发送真实消息。

## 文档

- [使用指南](USAGE.md) — 安装、命令、配置和故障排除
- [架构](ARCHITECTURE.md) — 组件、数据流和设计决策
- [OpenClaw集成](docs/openclaw.md) — MCP与实时监控
- [版本管理](VERSIONING.md) — 发布格式和自动化

## 常见问题

### 这是KakaoTalk官方工具吗？

不是。`kmsg`是独立维护的开源项目，与Kakao Corp.没有隶属、认可或维护关系。

### kmsg如何访问KakaoTalk？

它通过Apple的macOS辅助功能API操作用户正在运行的KakaoTalk应用界面，不实现私有LOCO协议。

### 是否包含MCP服务器？

是。`kmsg mcp-server`可为MCP客户端和AI智能体提供读取、文本发送及图片发送工具。

### 支持哪些操作系统？

仅支持macOS 13及更高版本，不支持Windows、Linux、Android或iOS。

## 许可证

`kmsg`采用[MIT License](https://github.com/channprj/kmsg/blob/main/LICENSE)发布。
