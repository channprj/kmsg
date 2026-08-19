# kmsg使用指南

本页介绍安装、消息读取与发送、MCP服务器以及常见故障处理。全部参数与最新契约请参阅[英文完整参考](https://github.com/channprj/kmsg/blob/main/USAGE.md)。

## 安装

### 环境要求

- macOS 13或更高版本
- macOS版KakaoTalk
- 为实际运行的`kmsg`二进制授予辅助功能权限

### Homebrew

```bash
brew install channprj/tap/kmsg
```

更新:

```bash
kmsg update
```

`kmsg update`会在需要时安装Homebrew，安装或升级formula，并将直接安装的二进制文件链接到由Homebrew管理的命令。

### 从源码构建

```bash
git clone https://github.com/channprj/kmsg.git
cd kmsg
swift build -c release
install -m 755 .build/release/kmsg ~/.local/bin/kmsg
```

## 快速开始

首先检查权限和KakaoTalk状态。

```bash
kmsg status --verbose
```

列出聊天并读取最近消息。

```bash
kmsg chats --limit 20
kmsg read "聊天名称" --limit 20
```

发送前先检查目标与内容。

```bash
kmsg send "聊天名称" "你好" --dry-run
```

`--dry-run`会在访问KakaoTalk UI之前结束，因此不会发送消息。

## 登录与权限

```bash
kmsg auth login
kmsg auth login --auto
```

密码使用AES-GCM加密，凭据和密钥分别存放在仅所有者可访问的文件中。请勿公开或上传这些文件。

```text
~/.config/kmsg/credentials.json
~/.config/kmsg/credentials/primary.key
```

### 锁定模式

如果KakaoTalk显示锁定界面，命令会先解锁再继续。锁定密码在KakaoTalk中设置，与账号密码无关；只需输入一次，`kmsg`就会将它与账号凭据一起加密保存。

每条命令只尝试解锁一次，因为多次输错锁定密码会导致KakaoTalk将账号登出。密码被拒绝时会清除已保存的值，下一条命令会重新提示输入。

没有终端的调用方（`kmsg mcp-server`、`kmsg watch`、cron）无法接收输入。先在终端解锁一次以保存密码，之后它们就能自行解锁。

## 命令概览

| 命令 | 用途 |
|---|---|
| `kmsg status` | 检查权限、KakaoTalk、登录和就绪状态 |
| `kmsg auth login` | 输入或复用凭据 |
| `kmsg chats` | 获取聊天列表与本地`chat_id` |
| `kmsg read` | 读取最近消息 |
| `kmsg watch` | 持续监控新消息 |
| `kmsg send` | 发送文本消息 |
| `kmsg send-image` | 发送图片 |
| `kmsg inspect` | 检查AX层级 |
| `kmsg cache` | 管理AX路径缓存 |
| `kmsg mcp-server` | 启动原生stdio MCP服务器 |
| `kmsg update` | 将kmsg更新到Homebrew发布版本 |

## 安全读取

不希望打断前台工作时，可使用`--background-safe`。

```bash
kmsg read "聊天名称" --json --background-safe
```

此模式不会启动或激活KakaoTalk，也不会登录、搜索、打开、调整或关闭窗口。如果匹配的聊天窗口尚未显示，读取会失败。

### 找不到`--background-safe`时

此CLI标志从kmsg `v1.260618.0`开始提供，并且仅适用于`kmsg read`命令。请先确认当前Shell实际执行的二进制文件：

```bash
kmsg --version
kmsg read --help
```

如果帮助中没有此标志，请更新Homebrew安装后再次检查：

```bash
brew update
brew upgrade kmsg
kmsg read --help
```

MCP客户端不使用CLI写法`--background-safe`，而是使用JSON参数`background_safe: true`。

## 发送

```bash
kmsg send <recipient> <message> [options]
kmsg send --chat-id <chat-id> <message> [options]
```

| 选项 | 行为 |
|---|---|
| `--dry-run` | 不操作UI，只显示目标与内容 |
| `--chat-id ID` | 使用`kmsg chats`生成的本地ID |
| `--keep-window` | 保留命令打开的聊天窗口 |
| `--no-cache` | 清除相关AX缓存并重新查找 |
| `--layout MODE` | 指定窗口布局 |

发送图片:

```bash
kmsg send-image "聊天名称" /absolute/path/image.png --dry-run
```

## JSON与MCP

```bash
kmsg chats --json
kmsg read "聊天名称" --json
kmsg watch "聊天名称" --json
```

结构化结果写入`stdout`，AX诊断写入`stderr`。

MCP服务器提供以下工具。

| 工具 | 用途 |
|---|---|
| `kmsg_read` | 读取最近消息 |
| `kmsg_send` | 发送文本 |
| `kmsg_send_image` | 发送本地图片 |

对于发送工具，`confirm=true`不会发送，而是返回`CONFIRMATION_REQUIRED`。`confirm=false`或省略时会立即发送。

## 主要环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `KMSG_MCP_KMSG_PATH` | 当前可执行文件 | MCP服务器调用的`kmsg`路径 |
| `KMSG_MCP_TIMEOUT_SECONDS` | `30` | 子进程超时时间 |
| `KMSG_DEFAULT_LAYOUT` | `preserve` | 默认窗口布局 |
| `KMSG_DEFAULT_BACKGROUND_SAFE` | `false` | 安全读取默认值 |
| `KMSG_DEFAULT_DEEP_RECOVERY` | `false` | 深度恢复默认值 |

## 故障排除

### 没有辅助功能权限

```bash
kmsg status
```

请在系统设置中允许实际运行的二进制。Homebrew版本和本地构建可能会被视为不同的程序。

### 找不到聊天

```bash
kmsg chats --verbose --limit 50
kmsg cache clear
kmsg read "准确的聊天名称" --deep-recovery
```

重复自动化时，建议先用`kmsg chats`刷新注册表，再使用`chat_id`。

### UI结构发生变化

```bash
kmsg read "聊天名称" --debug --trace-ax
kmsg inspect --depth 5
kmsg cache stats
```

KakaoTalk更新后，可清除缓存并重新发现路径。
