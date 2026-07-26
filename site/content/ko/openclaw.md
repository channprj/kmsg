# OpenClaw 연동 가이드

이 문서는 `kmsg`를 OpenClaw 또는 다른 MCP 클라이언트에 연결하는 안전한 기본 구성을 설명합니다.

## 핵심 모델

연동에는 서로 다른 두 인터페이스가 있습니다.

- 요청·응답: 네이티브 `kmsg mcp-server`
- 실시간 이벤트: 별도 프로세스로 실행하는 `kmsg watch --json`

MCP 서버는 `kmsg_read`, `kmsg_send`, `kmsg_send_image`를 제공합니다. `watch`는 MCP 도구가 아니므로 실시간 자동 응답이 필요하면 감시 프로세스의 이벤트를 OpenClaw에 전달하는 작은 supervisor가 필요합니다.

## 권장 구조

```text
kmsg watch --json
    ↓ one JSON object per event
supervisor / OpenClaw
    ↓ reasoning and approval
kmsg_send through MCP
```

감시와 요청·응답을 분리하면 MCP 호출은 짧고 예측 가능하게 유지되고, 장시간 실행 스트림은 독립적으로 재시작할 수 있습니다.

## 준비 사항

- macOS용 KakaoTalk 설치와 로그인
- 실제 `kmsg` 바이너리에 대한 손쉬운 사용 권한
- `kmsg status` 성공
- `kmsg chats`와 dry run 검증

```bash
kmsg status --verbose
kmsg chats --limit 20
kmsg send "채팅방 이름" "연결 테스트" --dry-run
```

## MCP 설정

서버를 직접 실행할 수 있습니다.

```bash
kmsg mcp-server
```

MCP 클라이언트 설정 예시는 다음과 같습니다.

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

MCP 프로세스에서 Homebrew 경로를 찾지 못하면 `command`에 절대 경로를 지정하세요.

## 실시간 감시

```bash
kmsg watch "채팅방 이름" --json
```

출력은 이벤트마다 JSON 한 개이며, 진단 로그는 `stderr`에 남습니다. supervisor는 `stdout`만 파싱하고 재시작·중복 처리·승인 정책을 책임지는 것이 좋습니다.

## 도구 계약

### `kmsg_read`

```json
{
  "name": "kmsg_read",
  "arguments": {
    "chat": "채팅방 이름",
    "limit": 20,
    "background_safe": true
  }
}
```

`background_safe=true`는 이미 열려 있는 일치 창만 읽습니다. KakaoTalk 실행·활성화·로그인·검색·창 열기·크기 조절·닫기를 수행하지 않습니다.

### `kmsg_send`

```json
{
  "name": "kmsg_send",
  "arguments": {
    "chat": "채팅방 이름",
    "message": "안녕하세요",
    "confirm": true
  }
}
```

- `confirm=true`: 전송하지 않고 `CONFIRMATION_REQUIRED` 반환
- `confirm=false` 또는 생략: 즉시 전송
- `dry_run=true`: KakaoTalk UI에 접근하지 않고 대상과 내용만 확인

### `kmsg_send_image`

```json
{
  "name": "kmsg_send_image",
  "arguments": {
    "chat": "채팅방 이름",
    "image_path": "/absolute/path/image.png",
    "confirm": true
  }
}
```

경로는 MCP 서버가 실행되는 Mac에서 읽을 수 있는 절대 경로여야 합니다.

## 운영 모드

### 권장: 초안 후 승인

1. `kmsg_read` 또는 watch 이벤트로 문맥을 가져옵니다.
2. 에이전트가 답장을 초안으로 만듭니다.
3. 사람 또는 정책 엔진이 대상과 내용을 승인합니다.
4. 승인된 호출만 `confirm=false`로 전송합니다.

개인 채팅은 오발송 비용이 크므로 이 흐름을 기본값으로 권장합니다.

### 고급: 완전 자동 응답

완전 자동화는 허용된 채팅, 전송 빈도, 재시도 횟수, 최대 메시지 길이, 금지어, 긴급 중단 스위치를 supervisor에서 제한한 경우에만 사용하세요.

## 문제 해결

### 서버가 시작되지 않습니다

```bash
kmsg mcp-server
kmsg status --verbose
```

클라이언트의 `command` 경로와 실행 권한, 손쉬운 사용 권한을 확인합니다.

### 읽기가 실패합니다

background-safe 모드라면 대상 채팅 창을 먼저 열어 두거나, 포그라운드 조작이 허용될 때만 해당 옵션을 끄세요.

### 프레이밍 오류가 발생합니다

서버는 `Content-Length` 기반 MCP 프레임과 줄 단위 JSON-RPC를 지원합니다. 한 연결 안에서는 한 프레이밍 방식을 일관되게 사용하세요.

전체 필드와 응답 예시는 [영문 OpenClaw 문서](https://github.com/channprj/kmsg/blob/main/docs/openclaw.md)를 참고하세요.
