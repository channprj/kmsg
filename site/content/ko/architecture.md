# kmsg 아키텍처

## 개요

`kmsg`는 macOS 13 이상에서 동작하는 Swift 6 실행 파일입니다. KakaoTalk의 비공개 네트워크 프로토콜을 구현하지 않고, 사용자가 보는 macOS 앱을 손쉬운 사용 API로 제어합니다.

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

네이티브 stdio MCP 서버는 동일한 `kmsg` 실행 경로를 하위 프로세스로 호출하고 결과를 구조화해 반환합니다. CLI와 MCP가 자동화 로직을 따로 구현하지 않도록 한 구조입니다.

## 주요 구성 요소

| 구성 요소 | 책임 |
|---|---|
| `Sources/kmsg/kmsg.swift` | 명령 등록, 버전 노출, 도움말 진입점 |
| `Sources/kmsg/Commands/` | 인수 파싱, 권한·인증 조정, 출력 형식 |
| `UIElement` | `AXUIElement` 래퍼와 제한된 계층 탐색 |
| `AXActionRunner` | 포커스, 텍스트 입력, 키보드, 재시도 |
| `AXPathCacheStore` | 검증된 AX 경로 저장과 stale 경로 폐기 |
| `KakaoTalkApp` | 프로세스·창 탐색, 실행, 활성화, 복구 |
| `ChatListScanner` | 채팅 목록과 미리보기 읽기 |
| `ChatIdentityRegistryStore` | 로컬 합성 `chat_id` 관리 |
| `ChatWindowResolver` | 기존 창 재사용과 검색·복구 |
| `KakaoTalkTranscriptReader` | 메시지, 시간, 이미지, 링크 파싱 |
| `KmsgMCPServer` | MCP 프레이밍, 도구 스키마, 제한 시간, 오류 매핑 |

## 데이터 흐름

### 시작과 인증

1. UI 접근이 필요한 명령이 손쉬운 사용 권한을 확인합니다.
2. 필요하면 `KakaoTalkApp`이 KakaoTalk을 실행합니다.
3. 현재 로그인 상태를 확인합니다.
4. 로그인이 필요하면 암호화된 자격 증명을 사용하거나 입력을 요청합니다.

`read --background-safe`는 `KakaoTalkApp(autoLaunch: false)`를 사용하고 자동 로그인과 포그라운드 UI 조작을 건너뜁니다.

### 채팅 탐색과 읽기

1. 채팅 이름 또는 로컬 `chat_id`로 창을 찾습니다.
2. 입력 요소, 채팅 패널, 메시지 목록 루트를 결정합니다.
3. 표시된 행을 정규화된 메시지 레코드로 변환합니다.
4. 사람이 읽는 텍스트 또는 단일 JSON 문서로 출력합니다.
5. 명령이 임시로 연 창만 닫습니다.

### 감시

`watch`는 시작 시 기존 기록을 기준선으로 잡고 이후에 나타난 메시지만 내보냅니다. 안정적인 시간 정보가 없는 행은 과거 메시지를 다시 재생하지 않도록 시작 구간에서 억제할 수 있습니다.

### 전송

텍스트 전송은 대상 창과 입력 요소를 찾고 Unicode 텍스트를 입력한 뒤 전송 동작을 검증합니다. 이미지 전송은 macOS pasteboard를 사용하고 KakaoTalk의 확인 UI를 처리합니다.

### MCP 호출

```text
MCP client
    ↓ stdio
kmsg mcp-server
    ↓ subprocess
kmsg read / send / send-image
    ↓
KakaoTalk Accessibility automation
```

이 프로세스 경계 덕분에 MCP 호출도 일반 CLI와 같은 권한, 캐시, 오류 계약을 사용합니다.

## 로컬 상태

| 경로 | 내용 |
|---|---|
| `~/.config/kmsg/credentials.json` | 자격 증명 메타데이터와 암호문 |
| `~/.config/kmsg/credentials/primary.key` | 로컬 AES-GCM 키 |
| `~/.kmsg/ax-path-cache.json` | 검증된 AX 경로 |
| `~/.kmsg/chat-registry.json` | 로컬 합성 채팅 ID |

자격 증명과 키 파일은 `0600` 권한을 사용합니다. AX 캐시는 KakaoTalk 버전·루트 지문·스키마·TTL을 확인하며, 검증에 실패한 경로는 제한된 재탐색으로 복구합니다.

## 설계 결정

### 비공개 프로토콜 대신 손쉬운 사용 API

KakaoTalk은 서드파티 메시징 API를 공식 제공하지 않습니다. `kmsg`는 비공개 LOCO 프로토콜을 역공학하지 않고, 사용자가 실행 중인 앱의 보이는 UI와 상호작용합니다. 이것이 공식 연동이나 무위험 사용을 뜻하지는 않으며, 서비스 약관과 제재 판단은 Kakao에 있습니다.

### macOS 네이티브 실행 파일

Swift는 `AppKit`, `ApplicationServices`, `AXUIElement`, `CGEvent` 같은 macOS API와 직접 맞닿습니다. 별도 런타임 없이 단일 바이너리로 배포하고 SwiftPM으로 빌드·검증할 수 있습니다.

### 제한된 탐색과 self-healing 캐시

AX 계층 전체 탐색은 비싸고 KakaoTalk 버전에 따라 바뀔 수 있습니다. 모든 탐색에는 노드 예산과 제한을 적용하고, 성공한 경로는 저장하되 사용 전 다시 검증합니다.

### 명시적인 상호작용 모드

기본 경로는 불필요한 재실행과 창 조작을 피합니다. background-safe 읽기, 깊은 복구, 창 배치는 사용자가 명시적으로 선택합니다.

### 출력 채널 분리

구조화된 결과는 `stdout`, AX 진단은 `stderr`에 기록합니다. JSON 소비자와 MCP 하위 프로세스가 로그와 payload를 혼합하지 않도록 하기 위한 계약입니다.

## 더 자세한 원문

전체 데이터 흐름과 디렉터리 구조, 설계 근거는 [영문 아키텍처 문서](https://github.com/channprj/kmsg/blob/main/ARCHITECTURE.md)에서 확인할 수 있습니다.
