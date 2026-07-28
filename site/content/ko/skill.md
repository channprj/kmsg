# kmsg 코딩 에이전트 Skill

`kmsg` Skill은 Claude Code와 Codex가 macOS용 KakaoTalk을 같은 안전한 절차로
탐색하고 읽고 전송하도록 안내합니다.

## 준비 사항

- macOS 13 이상
- 로그인된 macOS용 KakaoTalk
- 설치된 `kmsg` 바이너리에 대한 손쉬운 사용 권한

## Skill 설치

```bash
npx skills add channprj/kmsg --skill kmsg --agent claude-code codex -g -y
```

## 에이전트에서 호출

| 에이전트 | 호출 |
|---|---|
| Claude Code | `/kmsg` |
| Codex | `$kmsg` |

## 안전한 기본 흐름

1. `kmsg status --verbose`로 권한과 로그인 상태를 확인합니다.
2. `kmsg chats --limit 20`으로 실제 채팅 이름을 확인합니다.
3. `kmsg read "채팅 이름" --limit 20`으로 최근 메시지를 읽습니다.
4. 전송 전 `kmsg send "채팅 이름" "메시지" --dry-run`을 실행합니다.

## MCP와 함께 사용

장기 실행 이벤트에는 `kmsg watch --json`, 요청·응답 도구에는
`kmsg mcp-server`를 사용합니다. 자세한 구성은 [MCP 문서](../mcp/)에서
확인합니다.

## 문제 해결

명령이 실패하면 `kmsg status --verbose`와 `kmsg inspect --depth 5`를 먼저
확인하고, 전체 옵션은 [사용법](../usage/)을 참고합니다.
