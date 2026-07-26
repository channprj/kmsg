# OpenClaw集成指南

本页说明如何将`kmsg`安全地接入OpenClaw或其他MCP客户端。

## 基本模型

集成包含两个独立接口。

- 请求与响应: `kmsg mcp-server`
- 实时事件: `kmsg watch --json`

MCP服务器提供`kmsg_read`、`kmsg_send`和`kmsg_send_image`。`watch`并非MCP工具；若要实时自动回复，需要一个supervisor把事件转交给OpenClaw。

## 推荐架构

```text
kmsg watch --json
    ↓ one JSON object per event
supervisor / OpenClaw
    ↓ reasoning and approval
kmsg_send through MCP
```

将长时间运行的监控流与短时MCP调用分开，便于独立处理重启、去重和审批。

## 使用前检查

```bash
kmsg status --verbose
kmsg chats --limit 20
kmsg send "聊天名称" "连接测试" --dry-run
```

## MCP配置

```bash
kmsg mcp-server
```

客户端配置示例:

```json
{
  "mcpServers": {
    "kmsg": {
      "command": "/absolute/path/to/kmsg",
      "args": ["mcp-server"],
      "env": {
        "KMSG_MCP_TIMEOUT_SECONDS": "30",
        "KMSG_DEFAULT_LAYOUT": "preserve",
        "KMSG_DEFAULT_BACKGROUND_SAFE": "true"
      }
    }
  }
}
```

## 实时监控

```bash
kmsg watch "聊天名称" --json
```

每个事件向`stdout`写入一个JSON对象，诊断日志写入`stderr`。supervisor应负责重启、去重、速率限制和审批策略。

## 工具契约

### `kmsg_read`

```json
{
  "name": "kmsg_read",
  "arguments": {
    "chat": "聊天名称",
    "limit": 20,
    "background_safe": true
  }
}
```

`background_safe=true`只读取已经显示的匹配窗口，不会启动、激活、登录、搜索或调整KakaoTalk窗口。

### `kmsg_send`

```json
{
  "name": "kmsg_send",
  "arguments": {
    "chat": "聊天名称",
    "message": "你好",
    "confirm": true
  }
}
```

- `confirm=true`: 不发送，返回`CONFIRMATION_REQUIRED`
- `confirm=false`或省略: 立即发送
- `dry_run=true`: 不操作UI，只检查目标与内容

### `kmsg_send_image`

```json
{
  "name": "kmsg_send_image",
  "arguments": {
    "chat": "聊天名称",
    "image_path": "/absolute/path/image.png",
    "confirm": true
  }
}
```

## 运行模式

### 推荐: 先生成草稿，再审批

1. 通过`kmsg_read`或watch事件获取上下文。
2. AI智能体生成回复草稿。
3. 人或策略引擎检查收件目标与内容。
4. 仅将获批请求以`confirm=false`发送。

个人聊天中的误发成本较高，因此推荐把此流程作为默认模式。

### 完全自动回复

仅在supervisor限制了允许的聊天、发送频率、重试次数、最大长度、禁用词和紧急停止开关时启用。

## 故障排除

- 在`command`中使用可执行`kmsg`的绝对路径
- 运行`kmsg status --verbose`检查权限和KakaoTalk状态
- background-safe失败时，先显示目标聊天窗口
- 同一连接内不要混用不同MCP帧格式

完整字段与响应示例请参阅[英文OpenClaw指南](https://github.com/channprj/kmsg/blob/main/docs/openclaw.md)。
