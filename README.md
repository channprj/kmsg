# kmsg

<p><img src="assets/kmsg-logo.jpg" alt="kmsg logo" width="220" /></p>

> **Disclaimer**: `kmsg`는 Kakao Corp. 의 공식 도구가 아닙니다.
> 사용자는 본인 계정/환경에서 관련 법규, 서비스 약관, 회사 보안 정책을 준수할 책임이 있습니다.
> 이 도구 사용으로 발생할 수 있는 계정 제한, 오작동, 데이터 손실, 기타 손해에 대한 책임은 사용자에게 있습니다.

`kmsg` 는 macOS에서 카카오톡 메시지를 CLI 로 읽고 보내는 도구입니다. 단순한 수동 CLI 를 넘어, AI Agent 또는 Hook 이벤트 등의 자동화 파이프라인에 연결하기 쉽도록 구현했습니다. kmsg 는 [openclaw](https://github.com/openclaw/openclaw) 의 창시자인 [steipete](https://github.com/steipete) 가 만든 iMessage 컨트롤을 위한 CLI 도구인 [imsg](https://github.com/steipete/imsg) 에 영감을 받아 작성되었습니다.

## Demo

https://github.com/user-attachments/assets/c620b2e3-7106-40fa-86d1-ed847e3b1a6f

## 빠른 시작

요구사항:

- macOS 13+
- [macOS용 KakaoTalk](https://apps.apple.com/kr/app/kakaotalk/id869223134?mt=12) 설치

### 설치 (Homebrew 권장)

```bash
brew install channprj/tap/kmsg
```

특정 릴리즈를 고정해서 설치하려면 exact version formula를 사용할 수 있습니다.
tap에는 최신 10개 릴리즈만 유지됩니다.

```bash
brew install channprj/tap/kmsg@0.2.7
```

### 설치 (직접 다운로드)

```bash
mkdir -p ~/.local/bin && curl -fL https://github.com/channprj/kmsg/releases/latest/download/kmsg-macos-universal -o ~/.local/bin/kmsg && chmod +x ~/.local/bin/kmsg
```

설치 확인은 아래와 같이 진행합니다.

```bash
kmsg status
```

권한 팝업이 뜨면 허용해 주세요.

`kmsg`를 바로 실행하고 싶다면 아래와 같이 PATH 등록을 해주세요.

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
```

## 가장 많이 쓰는 명령

```bash
kmsg status
kmsg send "본인, 친구, 또는 단톡방 이름" "안녕하세요"
kmsg send --chat-id "chat_7f42c5e1d9ab" "안녕하세요"
kmsg send "본인, 친구, 또는 단톡방 이름" "$(date '+%Y-%m-%d %H:%M:%S') 테스트"
kmsg send "본인, 친구, 또는 단톡방 이름" "테스트" --keep-window
kmsg send-image "본인, 친구, 또는 단톡방 이름" "/path/to/image.png"
kmsg chats
kmsg chats --json
kmsg read "본인, 친구, 또는 단톡방 이름" --limit 20
kmsg read "본인, 친구, 또는 단톡방 이름" --limit 20 --keep-window
kmsg read "본인, 친구, 또는 단톡방 이름" --limit 20 --json
kmsg read "본인, 친구, 또는 단톡방 이름" --limit 20 --deep-recovery
kmsg inspect --window 0 --depth 20 --debug-layout
```

## CLI 명령어 레퍼런스

옵션은 빌드 기준 `kmsg --help`, `kmsg <command> --help` 출력과 동일하게 관리됩니다.

### status

```bash
kmsg status [--verbose]
```

- `--verbose`: 상세 상태 출력

### chats

```bash
kmsg chats [--verbose] [--limit <limit>] [--trace-ax] [--json] [--keep-window]
```

- `-v, --verbose`: 상세 정보 출력
- `-l, --limit <limit>`: 최대 채팅 목록 개수 (기본값: 20)
- `--trace-ax`: AX 탐색/재시도 로그 출력
- `--json`: `chat_id`를 포함한 구조화 JSON 출력
- `-k, --keep-window`: `chats` 실행 중 자동으로 연 창을 유지

기본 출력에는 각 채팅의 `chat_id`가 함께 표시됩니다. `chat_id`는 로컬 registry(`~/.kmsg/chat-registry.json`)에 저장되는 synthetic ID이며, 채팅방 이름을 기준으로 생성/재사용됩니다. 같은 이름의 방이 여러 개면 registry가 별도 ID를 유지하고, 방 이름이 바뀌면 새 ID로 취급합니다. `chats`가 실행 중 창을 자동으로 열었다면 기본적으로 종료 시 닫고, `--keep-window`일 때만 유지합니다.

### read

```bash
kmsg read <chat> [--limit <limit>] [--debug] [--trace-ax] [--keep-window] [--deep-recovery] [--json]
```

- `-l, --limit <limit>`: 최대 메시지 개수 (기본값: 20)
- `--debug`: raw element 디버그 정보 출력
- `--trace-ax`: AX 탐색/재시도 로그 출력
- `-k, --keep-window`: 자동으로 연 채팅창 유지
- `--deep-recovery`: 빠른 탐색 실패 시 deep recovery 수행
- `--json`: JSON 형식으로 출력

### send

```bash
kmsg send <recipient> <message> [--dry-run] [--trace-ax] [--no-cache] [--refresh-cache] [--keep-window] [--deep-recovery]
kmsg send --chat-id <chat-id> <message> [--dry-run] [--trace-ax] [--no-cache] [--refresh-cache] [--keep-window] [--deep-recovery]
```

- `--chat-id <chat-id>`: `kmsg chats`에서 출력된 `chat_id`로 전송
- `--dry-run`: 실제 전송 없이 시뮬레이션
- `--trace-ax`: AX 탐색/재시도 로그 출력
- `--no-cache`: 이번 실행에서 AX path cache 비활성화
- `--refresh-cache`: 이번 실행에서 AX path cache 강제 재구성
- `-k, --keep-window`: 자동으로 연 채팅창 유지
- `--deep-recovery`: 빠른 탐색 실패 시 deep recovery 수행

`--chat-id` 전송은 local registry에서 채팅방 이름을 역조회한 뒤 기존 search/open 경로로 채팅을 엽니다. registry에 없는 ID는 즉시 실패합니다.

### send-image

```bash
kmsg send-image <recipient> <image-path> [--trace-ax] [--no-cache] [--keep-window] [--deep-recovery]
```

- `--trace-ax`: AX 탐색/재시도 로그 출력
- `--no-cache`: 이번 실행에서 AX path cache 비활성화
- `-k, --keep-window`: 자동으로 연 채팅창 유지
- `--deep-recovery`: 빠른 탐색 실패 시 deep recovery 수행

### inspect

```bash
kmsg inspect [--depth <depth>] [--window <window>] [--show-attributes] [--show-path] [--show-frame] [--show-index] [--show-flags] [--show-actions] [--debug-layout] [--row-summary] [--row-range <start:end>]
```

- `-d, --depth <depth>`: 최대 탐색 깊이 (기본값: 4)
- `-w, --window <window>`: inspect 대상 창 인덱스 (기본값: main window)
- `--show-attributes`: 각 요소의 AX attribute 출력
- `--show-path`: 각 요소의 AX 경로 출력
- `--show-frame`: 각 요소 frame 출력
- `--show-index`: sibling index 출력
- `--show-flags`: 상태 플래그(`enabled/focused/selected/editable`) 출력
- `--show-actions`: 지원 AX action 출력
- `--debug-layout`: `path/frame/index/flags`를 한 번에 켜는 레이아웃 디버그 번들
- `--row-summary`: 메시지 row 요약 출력
- `--row-range <start:end>`: `--row-summary` 결과를 특정 범위만 출력 (inclusive, zero-based)

### cache

```bash
kmsg help cache
```

- `status` (default): 캐시 상태 출력
- `clear`: 캐시 삭제
- `export <output-path>`: 캐시 JSON 내보내기
- `import <input-path>`: 캐시 JSON 가져오기
- `warmup [--recipient <recipient>] [--trace-ax] [--keep-window]`: `send`/`chats` happy-path 경로 캐시 워밍업

## 권한 문제 해결

`kmsg`는 손쉬운 사용(Accessibility) 권한이 필요합니다.

앱이 자동 요청에 실패하면:

1. 시스템 설정 열기
2. `개인정보 보호 및 보안 > 손쉬운 사용`
3. `kmsg` 토글 켜기

## JSON 출력

`read` 명령은 `--json` 플래그로 구조화된 결과를 반환할 수 있습니다.

```bash
kmsg read "본인, 친구, 또는 단톡방 이름" --limit 20 --json
```

### 출력 형식

```json
{
  "chat": "홍길동",
  "fetched_at": "2026-02-26T01:23:45.678Z",
  "count": 20,
  "messages": [
    {
      "author": "홍길동",
      "time_raw": "00:27",
      "body": "밤이 깊었네"
    }
  ]
}
```

### 필드 설명

- `chat`: 실제로 읽은 채팅방 제목
- `fetched_at`: 메시지 수집 시각(ISO-8601 UTC)
- `count`: 반환된 메시지 개수
- `messages[].author`: 작성자 이름 (`(me)`는 내 메시지 또는 작성자 추론이 불가능한 경우)
- `messages[].time_raw`: UI에서 읽힌 시각 문자열(없으면 `null`)
- `messages[].body`: 메시지 본문

### 주의

- `--json` 사용 시 JSON은 `stdout`으로만 출력됩니다.
- `--trace-ax` 로그는 `stderr`로 분리되므로 OpenClaw 같은 파이프 연동에서 안전하게 사용할 수 있습니다.

`chats --json`도 동일하게 `stdout`에만 JSON을 출력하며, 각 채팅 항목에 `chat_id`와 `last_message`를 포함합니다. 첫 실행이나 캐시 self-heal 시에는 더 느릴 수 있지만, 이후 실행은 저장된 happy-path AX cache를 우선 사용합니다.

## MCP 연동

`kmsg` 는 MCP 로 붙여서 사용할 수도 있습니다.

우선, 아래와 같이 MCP 서버를 실행합니다.

```bash
python tools/kmsg-mcp.py
```

### OpenClaw 설정 예시

MCP 서버를 띄웠다면 아래와 같이 JSON 설정값을 주면서 MCP 연동을 해달라고 하면 됩니다. 정말 간단하죠? 그래도 args 의 path 는 수정하셔야 합니다.

```json
{
  "mcpServers": {
    "kmsg": {
      "command": "python3",
      "args": ["/path/to/kmsg/tools/kmsg-mcp.py"],
      "env": {
        "KMSG_BIN": "$HOME/.local/bin/kmsg",
        "KMSG_DEFAULT_DEEP_RECOVERY": "false",
        "KMSG_TRACE_DEFAULT": "false"
      }
    }
  }
}
```

### 제공되는 도구

- `kmsg_read`: `chat`, `limit`, `deep_recovery`, `keep_window`, `trace_ax`
- `kmsg_send`: `chat`, `message`, `confirm`, `deep_recovery`, `keep_window`, `trace_ax`
- `kmsg_send_image`: `chat`, `image_path`, `confirm`, `deep_recovery`, `keep_window`, `trace_ax`

`kmsg_send`, `kmsg_send_image`는 기본값(`confirm=false`, 또는 `confirm` 생략)에서 실제 전송을 수행합니다.
`confirm=true`로 호출하면 전송하지 않고 `CONFIRMATION_REQUIRED`를 반환합니다.

### MCP 빠른 사용

MCP 서버 연결 후, 아래 순서로 호출하면 됩니다.

1. 최근 메시지 읽기

```json
{
  "name": "kmsg_read",
  "arguments": {
    "chat": "홍길동",
    "limit": 20
  }
}
```

2. 메시지 보내기 (기본값: 즉시 전송)

```json
{
  "name": "kmsg_send",
  "arguments": {
    "chat": "홍길동",
    "message": "바로 전송됩니다."
  }
}
```

3. 이미지 보내기 (기본값: 즉시 전송)

```json
{
  "name": "kmsg_send_image",
  "arguments": {
    "chat": "홍길동",
    "image_path": "/path/to/image.png"
  }
}
```

4. 전송 전 확인 단계 강제 (`confirm=true`)

```json
{
  "name": "kmsg_send",
  "arguments": {
    "chat": "홍길동",
    "message": "사용자 승인 후 다시 전송",
    "confirm": true
  }
}
```

openclaw 와의 자세한 연동/운영 가이드는 [docs/openclaw.md](./docs/openclaw.md) 를 참고하세요.
설정 템플릿은 [docs/openclaw.mcp.example.json](./docs/openclaw.mcp.example.json) 에도 포함되어 있습니다.

## 로컬 빌드 및 개발

```bash
git clone https://github.com/channprj/kmsg.git
cd kmsg
swift build -c release
install -m 755 .build/release/kmsg ~/.local/bin/kmsg
```

### 고급 옵션

```bash
kmsg send "본인, 친구, 또는 단톡방 이름" "테스트" --trace-ax
kmsg send --chat-id "chat_7f42c5e1d9ab" "테스트" --dry-run
kmsg send "본인, 친구, 또는 단톡방 이름" "테스트" --dry-run --trace-ax
kmsg send "본인, 친구, 또는 단톡방 이름" "테스트" --no-cache
kmsg send "본인, 친구, 또는 단톡방 이름" "테스트" --refresh-cache
kmsg chats --json
kmsg send-image "본인, 친구, 또는 단톡방 이름" "/path/to/image.png" --trace-ax
KMSG_AX_TIMEOUT=0.25 kmsg send "본인, 친구, 또는 단톡방 이름" "테스트"
kmsg inspect --window 0 --depth 20 --debug-layout
kmsg inspect --window 0 --depth 20 --row-summary
kmsg inspect --window 0 --depth 20 --row-summary --row-range 10:35
kmsg cache status
kmsg cache warmup --recipient "본인, 친구, 또는 단톡방 이름" --trace-ax
kmsg cache warmup --recipient "본인, 친구, 또는 단톡방 이름" --keep-window
kmsg cache export ./ax-cache.json
kmsg cache import ./ax-cache.json
kmsg read "본인, 친구, 또는 단톡방 이름" --deep-recovery --trace-ax
kmsg send "본인, 친구, 또는 단톡방 이름" "테스트" --deep-recovery --trace-ax
kmsg send-image "본인, 친구, 또는 단톡방 이름" "/path/to/image.png" --deep-recovery --trace-ax --keep-window
```

`--deep-recovery`는 빠른 창 탐색이 실패할 때만 relaunch/open 복구를 추가로 수행합니다.
기본적으로 자동으로 연 카카오톡 창은 명령 종료 시 닫히며, `--keep-window`(또는 `-k`)로 유지할 수 있습니다.

### 디버깅 가이드 (inspect / trace-ax)

메시지 읽기/보내기가 기대와 다르면 아래 순서로 상태를 수집해 주세요.

```bash
# 1) 대상 채팅창 구조 확인
kmsg inspect --window 0 --depth 20 --debug-layout

# 1-1) 메시지 row 파싱 진단
kmsg inspect --window 0 --depth 20 --row-summary
kmsg inspect --window 0 --depth 20 --row-summary --row-range 10:30

# 2) 읽기 경로/AX 로그 확인
kmsg read "본인, 친구, 또는 단톡방 이름" --limit 20 --trace-ax

# 3) 보내기 경로/AX 로그 확인
kmsg send "본인, 친구, 또는 단톡방 이름" "테스트" --trace-ax --dry-run
```

- `AXTextArea, value: "..."` 는 실제 메시지 본문 후보입니다.
- `AXStaticText, value: "5\n00:27"` 같은 값은 보통 카운트/시간 메타 정보입니다.
- `--debug-layout`을 켜면 `path/frame/index/flags`가 함께 출력되어 위치 기반 분석이 쉬워집니다.
- `--row-summary`는 `read` 파서 기준으로 row별 `authorCandidates`, `time`, `buttonTitles`를 빠르게 점검할 때 유용합니다.
- 이슈 보고 시 `inspect` 출력과 `--trace-ax` 출력을 함께 첨부하면 원인 파악이 빨라집니다.

### Coding Agent에게 요청하기

개발을 진행하거나 버그 수정을 원할 때 Coding Agent에게 아래 정보와 함께 요청하면 좋습니다.

1. 실행한 명령어: `kmsg read ... --trace-ax`, `kmsg inspect ...`
2. 기대 결과: 무엇이 보여야 하는지
3. 실제 결과: 현재 무엇이 출력되는지
4. 관련 로그: `inspect` 본문 구간 (`AXRow > AXCell > AXTextArea`) + `trace-ax`

```text
kmsg read가 메시지 본문 대신 시간/숫자를 출력합니다.
inspect 결과를 기준으로 AXRow > AXCell > AXTextArea.value를 우선 추출하도록 수정해 주세요.
README 디버깅 가이드도 함께 업데이트해 주세요.
```

## Deploy

`v*` 태그를 푸시하면 GitHub Actions가 자동으로 빌드해서 `kmsg-macos-universal` 파일을 Releases에 업로드합니다.
같은 workflow가 `channprj/homebrew-tap` 리모트까지 자동으로 동기화하며, `TAP_REPO_TOKEN`이 없거나 tap push가 실패하면 릴리즈도 실패합니다.

배포 전에 `VERSION` 파일 값을 먼저 업데이트하세요.

```bash
# gh 토큰이 만료됐으면 재로그인
gh auth login -h github.com

# 배포 태그 생성/푸시
git tag v0.2.3
git push origin v0.2.3
```

필요하면 Actions를 수동 실행할 수 있습니다.
`workflow_dispatch`에서 `tag`를 비워두면 `VERSION` 파일을 읽어 `v<version>`으로 자동 생성합니다.
`tag`를 직접 입력할 경우 `vX.Y.Z` 형식만 허용됩니다.

```bash
# 태그를 직접 지정해서 실행
gh workflow run release.yml -f tag=v0.2.4

# tag 미지정 시 VERSION(예: 0.2.4) 기반으로 실행
gh workflow run release.yml
```

### Homebrew 자동 동기화 설정 (최초 1회)

1. `channprj/homebrew-tap` 저장소를 만들고 `Formula/` 디렉터리를 준비합니다.
2. `kmsg` 저장소 Secrets에 `TAP_REPO_TOKEN`을 추가합니다.
   - 권한: `homebrew-tap` 저장소 `contents: write`
3. tap 저장소 기본 브랜치가 `main`이 아니면
   `.github/workflows/release.yml`의 `TAP_REPO_REF` 값을 맞춰 주세요.

이제 `TAP_REPO_TOKEN`은 선택이 아니라 필수입니다.
secret이 없으면 바이너리 release만 만들고 끝내지 않고, workflow 전체가 실패해서 tap 반영 누락을 바로 잡도록 동작합니다.

릴리즈 후 사용자는 아래 명령으로 설치할 수 있습니다.

```bash
brew install channprj/tap/kmsg
brew install channprj/tap/kmsg@0.2.7
```

`kmsg` formula는 항상 최신 릴리즈를 가리키고, `kmsg@X.Y.Z` formula는 최근 10개 exact release만 유지됩니다.
이미 다른 버전을 설치했다면 아래처럼 링크를 전환할 수 있습니다.

```bash
brew unlink kmsg
brew link --overwrite kmsg@0.2.7
```

## 기타

- Homebrew 설치: `brew install channprj/tap/kmsg`
- exact 버전 설치: `brew install channprj/tap/kmsg@0.2.7`
- 직접 설치는 `kmsg-macos-universal` 아티팩트를 사용합니다.
- 다운로드 실패 시 https://github.com/channprj/kmsg/releases 에서 직접 내려받아 `~/.local/bin/kmsg`로 저장 후 `chmod +x ~/.local/bin/kmsg` 를 진행하시면 됩니다.

## Inspiration

This project is strongly inspired by [steipete](https://github.com/steipete) and his works.

- [imsg](https://github.com/steipete/imsg)
- [openclaw](https://github.com/openclaw/openclaw)

## References

- https://github.com/steipete/imsg
