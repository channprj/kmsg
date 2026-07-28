# kmsg编程智能体Skill

`kmsg` Skill帮助Claude Code和Codex按照同一套安全流程，在macOS版
KakaoTalk中查找聊天、读取消息并发送消息。

## 使用条件

- macOS 13或更高版本
- 已登录的macOS版KakaoTalk
- 已为安装的`kmsg`二进制文件授予辅助功能权限

## 安装Skill

```bash
npx skills add channprj/kmsg --skill kmsg --agent claude-code codex -g -y
```

## 在智能体中调用

| 智能体 | 调用方式 |
|---|---|
| Claude Code | `/kmsg` |
| Codex | `$kmsg` |

## 安全的默认流程

1. 使用`kmsg status --verbose`检查权限和登录状态。
2. 使用`kmsg chats --limit 20`确认准确的聊天名称。
3. 使用`kmsg read "聊天名称" --limit 20`读取最近消息。
4. 发送前运行`kmsg send "聊天名称" "消息" --dry-run`。

## 与MCP配合使用

长时间运行的事件使用`kmsg watch --json`，请求与响应工具使用
`kmsg mcp-server`。配置详情请参阅[MCP文档](../mcp/)。

## 故障排除

如果命令失败，请先检查`kmsg status --verbose`和
`kmsg inspect --depth 5`。全部选项请参阅[使用指南](../usage/)。
