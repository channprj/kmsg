# kmsg架构

## 概览

`kmsg`是面向macOS 13及更高版本的Swift 6可执行文件。它不实现KakaoTalk私有网络协议，而是通过辅助功能API操作屏幕上可见的macOS应用。

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

原生stdio MCP服务器通过子进程调用同一套`kmsg`命令，再将结果结构化返回。CLI与MCP因此共享权限、缓存及错误处理逻辑。

## 主要组件

| 组件 | 职责 |
|---|---|
| `Sources/kmsg/Commands/` | 参数解析、权限与认证、输出格式 |
| `UIElement` | `AXUIElement`封装和有界层级搜索 |
| `AXActionRunner` | 焦点、文本输入、键盘与重试 |
| `AXPathCacheStore` | 保存并验证AX路径 |
| `KakaoTalkApp` | 进程与窗口的启动、定位和恢复 |
| `ChatListScanner` | 读取聊天列表和预览 |
| `ChatIdentityRegistryStore` | 管理本地`chat_id` |
| `ChatWindowResolver` | 复用、搜索和恢复聊天窗口 |
| `KakaoTalkTranscriptReader` | 将消息行规范化 |
| `KmsgMCPServer` | MCP帧、工具、超时和错误映射 |

## 数据流

### 启动与认证

1. 需要UI访问的命令检查辅助功能权限。
2. 如有需要，启动KakaoTalk。
3. 检查当前登录状态。
4. 使用加密凭据或提示用户输入。

`read --background-safe`不会自动启动、登录或操作前台UI。

### 读取

1. 通过聊天名称或`chat_id`解析目标窗口。
2. 找到输入框、聊天面板和消息列表。
3. 将可见行转换为规范化消息记录。
4. 输出可读文本或单个JSON文档。

### 监控

`watch`在启动时建立现有记录基线，仅输出之后出现的消息。为避免重放旧消息，缺少可靠时间信息的行可能会在启动阶段被抑制。

### 发送

文本发送会找到输入框、输入Unicode文本并验证发送动作。图片发送使用macOS pasteboard，并处理KakaoTalk的确认UI。

## 本地状态

| 路径 | 内容 |
|---|---|
| `~/.config/kmsg/credentials.json` | 加密凭据 |
| `~/.config/kmsg/credentials/primary.key` | 本地AES-GCM密钥 |
| `~/.kmsg/ax-path-cache.json` | 已验证的AX路径 |
| `~/.kmsg/chat-registry.json` | 本地聊天ID |

缓存会检查KakaoTalk版本、根指纹、schema和TTL。过期路径会被丢弃，并通过有界搜索恢复。

## 设计决策

### 不使用私有协议

KakaoTalk没有公开面向第三方的官方消息API。`kmsg`不对LOCO协议进行逆向工程，而是与用户正在运行的应用UI交互。这并不代表官方集成或零风险使用。

### macOS原生实现

Swift可直接连接`AppKit`、`ApplicationServices`、`AXUIElement`和`CGEvent`，并以无需额外运行时的单个二进制发布。

### 有界搜索与自修复

AX层级搜索开销较高，而且KakaoTalk更新后结构可能变化。所有搜索都设置节点预算；已缓存路径在使用前会再次验证。

### 输出通道分离

结构化结果写入`stdout`，AX诊断写入`stderr`，避免JSON消费者和MCP子进程把日志混入payload。

更完整的数据流与目录结构请参阅[英文架构文档](https://github.com/channprj/kmsg/blob/main/ARCHITECTURE.md)。
