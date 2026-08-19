# kmsg 사용법

이 문서는 설치부터 메시지 읽기·전송, MCP 서버, 문제 해결까지 자주 쓰는 흐름을 한국어로 정리합니다. 모든 옵션과 최신 계약은 [영문 전체 레퍼런스](https://github.com/channprj/kmsg/blob/main/USAGE.md)에서 확인할 수 있습니다.

## 설치

### 요구 사항

- macOS 13 이상
- macOS용 KakaoTalk
- 설치한 `kmsg` 바이너리에 대한 손쉬운 사용 권한

### Homebrew

```bash
brew install channprj/tap/kmsg
```

업데이트는 다음 명령으로 진행합니다.

```bash
kmsg update
```

`kmsg update`는 필요하면 Homebrew를 설치하고, 포뮬러를 설치하거나 업그레이드한 뒤, 직접 설치한 바이너리를 Homebrew 명령으로 연결합니다.

### 직접 다운로드

릴리스에는 Apple Silicon과 Intel Mac을 모두 지원하는 `kmsg-macos-universal` 바이너리가 포함됩니다.

```bash
mkdir -p ~/.local/bin
curl -fL \
  https://github.com/channprj/kmsg/releases/latest/download/kmsg-macos-universal \
  -o ~/.local/bin/kmsg
chmod +x ~/.local/bin/kmsg
kmsg --version
```

직접 받은 바이너리도 `kmsg update`를 실행하면 Homebrew 설치본으로 전환됩니다.

### 소스에서 빌드

```bash
git clone https://github.com/channprj/kmsg.git
cd kmsg
swift build -c release
install -m 755 .build/release/kmsg ~/.local/bin/kmsg
```

## 빠른 시작

먼저 권한과 KakaoTalk 상태를 확인합니다.

```bash
kmsg status --verbose
```

채팅 목록을 확인하고 최근 메시지를 읽습니다.

```bash
kmsg chats --limit 20
kmsg read "채팅방 이름" --limit 20
```

실제 전송 전에는 반드시 dry run으로 대상과 메시지를 확인할 수 있습니다.

```bash
kmsg send "채팅방 이름" "안녕하세요" --dry-run
```

`--dry-run`은 KakaoTalk UI에 접근하기 전에 종료하므로 실제 메시지를 전송하지 않습니다.

## 로그인과 권한

대화형 명령은 KakaoTalk 로그인 상태를 확인합니다. 새 자격 증명을 입력하거나 저장된 자격 증명을 재사용할 수 있습니다.

```bash
kmsg auth login
kmsg auth login --auto
```

비밀번호는 AES-GCM으로 암호화하며 자격 증명과 키를 소유자 전용 권한으로 분리 저장합니다. 이 파일은 공유하거나 이슈에 첨부하지 마세요.

```text
~/.config/kmsg/credentials.json
~/.config/kmsg/credentials/primary.key
```

### 잠금 모드

KakaoTalk 잠금 화면이 떠 있으면 명령을 실행하기 전에 잠금을 해제합니다. 잠금 비밀번호는 KakaoTalk에서 직접 설정하는 값이며 계정 비밀번호와 별개이므로, 처음 한 번만 입력하면 계정 자격 증명과 함께 암호화해 저장합니다.

잠금 해제는 명령마다 한 번만 시도합니다. 잠금 비밀번호를 여러 번 틀리면 KakaoTalk이 계정을 로그아웃시키기 때문입니다. 비밀번호가 거부되면 저장된 값을 지우고 다음 명령에서 다시 입력을 요청합니다.

## 명령 레퍼런스

| 명령 | 용도 |
|---|---|
| `kmsg status` | 손쉬운 사용 권한, KakaoTalk 실행·로그인, 준비 상태 확인 |
| `kmsg auth login` | 자격 증명 입력 또는 저장된 자격 증명 재사용 |
| `kmsg chats` | 채팅 목록과 로컬 `chat_id` 조회 |
| `kmsg read` | 최근 메시지 읽기 |
| `kmsg watch` | 새 메시지를 지속적으로 감시 |
| `kmsg send` | 텍스트 메시지 전송 |
| `kmsg send-image` | 이미지 전송 |
| `kmsg inspect` | KakaoTalk AX 계층 구조 조사 |
| `kmsg cache` | self-healing AX 경로 캐시 관리 |
| `kmsg mcp-server` | 네이티브 stdio MCP 서버 실행 |
| `kmsg update` | Homebrew 릴리스로 kmsg 업데이트 |

### 안전한 읽기

포그라운드 작업을 방해하면 안 되는 자동화에서는 `--background-safe`를 사용합니다.

```bash
kmsg read "채팅방 이름" --json --background-safe
```

이 모드는 KakaoTalk을 실행하거나 활성화하지 않고, 로그인·검색·창 열기·크기 조절·닫기도 수행하지 않습니다. 일치하는 채팅 창이 이미 열려 있지 않으면 실패합니다.

#### `--background-safe`가 보이지 않을 때

이 CLI 플래그는 kmsg `v1.260618.0`부터 제공되며 `kmsg read` 명령에서만 사용할 수 있습니다. 현재 셸이 실행하는 바이너리를 먼저 확인하세요.

```bash
kmsg --version
kmsg read --help
```

도움말에 플래그가 없다면 Homebrew 설치본을 업데이트한 뒤 다시 확인합니다.

```bash
brew update
brew upgrade kmsg
kmsg read --help
```

MCP 클라이언트에서는 CLI 표기인 `--background-safe` 대신 JSON 인자 `background_safe: true`를 사용합니다.

### 텍스트 전송

```bash
kmsg send <recipient> <message> [options]
kmsg send --chat-id <chat-id> <message> [options]
```

주요 옵션은 다음과 같습니다.

| 옵션 | 동작 |
|---|---|
| `--dry-run` | UI에 접근하지 않고 대상과 메시지만 출력 |
| `--chat-id ID` | `kmsg chats`에서 생성한 로컬 ID 사용 |
| `--keep-window` | 명령이 연 채팅 창을 유지 |
| `--no-cache` | 관련 AX 캐시를 지우고 다시 탐색 |
| `--layout MODE` | `preserve`, `left`, `right`, `split-left`, `split-right` 중 선택 |

### 이미지 전송

```bash
kmsg send-image "채팅방 이름" /absolute/path/image.png --dry-run
```

이미지 경로는 읽을 수 있는 로컬 파일이어야 합니다. dry run으로 확인한 뒤에만 실제 전송을 실행하세요.

## JSON 출력과 MCP

`--json`을 지원하는 명령은 구조화된 결과를 `stdout`에 기록하고 AX 추적 로그는 `stderr`에 분리합니다.

```bash
kmsg chats --json
kmsg read "채팅방 이름" --json --limit 20
kmsg watch "채팅방 이름" --json
```

네이티브 MCP 서버는 다음 도구를 제공합니다.

| 도구 | 용도 |
|---|---|
| `kmsg_read` | 채팅 이름으로 최근 메시지 읽기 |
| `kmsg_send` | 채팅 이름으로 텍스트 전송 |
| `kmsg_send_image` | 채팅 이름으로 로컬 이미지 전송 |

전송 도구에서 `confirm=false` 또는 생략된 `confirm`은 즉시 전송합니다. `confirm=true`는 전송하지 않고 `CONFIRMATION_REQUIRED`를 반환합니다.

## 환경 변수

| 변수 | 기본값 | 설명 |
|---|---|---|
| `KMSG_MCP_KMSG_PATH` | 현재 실행 파일 | MCP 서버가 호출할 `kmsg` 경로 |
| `KMSG_MCP_TIMEOUT_SECONDS` | `30` | 하위 프로세스 제한 시간 |
| `KMSG_DEFAULT_LAYOUT` | `preserve` | 기본 창 배치 |
| `KMSG_DEFAULT_BACKGROUND_SAFE` | `false` | `kmsg_read`의 기본 안전 읽기 모드 |
| `KMSG_DEFAULT_DEEP_RECOVERY` | `false` | 더 깊은 창 복구 기본값 |
| `KMSG_MCP_STARTUP_STATUS_CHECK` | `false` | MCP 시작 시 상태 확인 여부 |

## 문제 해결

### 손쉬운 사용 권한이 없습니다

```bash
kmsg status
```

시스템 설정에서 실제로 실행하는 바이너리를 허용한 뒤 다시 시도합니다. Homebrew 경로와 직접 빌드 경로는 서로 다른 바이너리로 인식될 수 있습니다.

### 채팅을 찾지 못합니다

```bash
kmsg chats --verbose --limit 50
kmsg cache clear
kmsg read "정확한 채팅방 이름" --deep-recovery
```

반복 자동화에서는 `kmsg chats`로 레지스트리를 갱신하고 `chat_id`를 사용하는 편이 안정적입니다.

### 메시지 파싱이나 AX 경로가 불안정합니다

```bash
kmsg read "채팅방 이름" --debug --trace-ax
kmsg inspect --depth 5
kmsg cache stats
```

KakaoTalk 업데이트 후에는 캐시를 지우고 다시 탐색하세요.

## 개발과 릴리스

```bash
swift build
swift build -c release
python3 -m pytest -q
```

릴리스 버전은 루트의 `VERSION`을 기준으로 하며 수동 편집 대신 프로젝트의 릴리스 명령을 사용합니다. 자세한 규칙은 [버전 관리 문서](../versioning/)를 참고하세요.
