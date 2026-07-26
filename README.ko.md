# kmsg

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Total downloads](https://img.shields.io/github/downloads/channprj/kmsg/total?label=downloads&logo=github)](https://github.com/channprj/kmsg/releases)

[English](README.md)

<p><img src="assets/kmsg-logo.jpg" alt="kmsg logo" width="220" /></p>

> **Disclaimer**: `kmsg`는 Kakao Corp. 의 공식 도구가 아닙니다.
> 사용자는 본인 계정/환경에서 관련 법규, 서비스 약관, 회사 보안 정책을 준수할 책임이 있습니다.
> 이 도구 사용으로 발생할 수 있는 계정 제한, 오작동, 데이터 손실, 기타 손해에 대한 책임은 사용자에게 있습니다.
> LOCO Protocol 이 아닌 AX 를 사용한 이유와 계정 제재 가능성에 대한 제 개인적인 판단은 [왜 KakaoTalk 의 LOCO Protocol 을 사용하지 않나요?](ARCHITECTURE.md#accessibility-instead-of-a-private-protocol) 항목을 참고해 주세요.

`kmsg` 는 macOS에서 카카오톡 메시지를 CLI 로 읽고 보내는 도구입니다.
단순한 수동 CLI 를 넘어, AI Agent 또는 Hook 이벤트 등의 자동화
파이프라인에 연결하기 쉽도록 구현했습니다.

## 데모

https://github.com/user-attachments/assets/c620b2e3-7106-40fa-86d1-ed847e3b1a6f

## 추천 영상

[![추천 영상: 헤르메스 에이전트 5개로 뉴스 큐레이션부터 주식 매매까지 자동화한 방법 전부 공개합니다](https://i.ytimg.com/vi/_Pd1G33_R48/hqdefault.jpg)](https://www.youtube.com/watch?v=_Pd1G33_R48&t=1020s)

**Builder Josh:** [헤르메스 에이전트 5개로 뉴스 큐레이션부터 주식 매매까지 자동화한 방법 전부 공개합니다 (AI 엔지니어 샘 호트만님)](https://www.youtube.com/watch?v=_Pd1G33_R48&t=1020s) — 17:00부터 재생

## 주요 기능

- 채팅 목록을 조회하고 재사용 가능한 로컬 `chat_id`를 생성합니다.
- 최근 메시지를 읽거나 새 메시지를 실시간으로 감시합니다.
- 화면에 표시되는 KakaoTalk UI를 제어해 텍스트와 이미지를 전송합니다.
- 구조화된 JSON을 `stdout`으로 출력하고 AX 추적 로그는 `stderr`로 분리합니다.
- 읽기, 텍스트 전송, 이미지 전송 도구를 제공하는 native stdio MCP 서버를 실행합니다.
- background-safe 읽기, 창 레이아웃, 복구 모드, self-healing AX path cache를 지원합니다.

## 요구사항

- macOS 13 이상
- [macOS용 KakaoTalk](https://apps.apple.com/kr/app/kakaotalk/id869223134?mt=12)
- 설치된 `kmsg` 바이너리에 대한 손쉬운 사용 권한

## 설치

Homebrew 설치를 권장합니다.

```bash
brew install channprj/tap/kmsg
```

직접 다운로드와 소스 빌드 방법은 [USAGE.md](USAGE.md#installation)를 참고하세요.

## 빠른 시작

```bash
kmsg status
kmsg chats
kmsg read "채팅방 이름" --limit 20
kmsg send "채팅방 이름" "안녕하세요" --dry-run
```

`kmsg status`는 손쉬운 사용 권한을 요청하고, 필요하면 KakaoTalk을 실행한
뒤 로그인 상태를 확인합니다. 마지막 명령은 dry run이므로 실제 메시지를
전송하지 않습니다.

## 자세한 문서

- [사용법](USAGE.md) — 설치, 명령, 설정, 예제, 문제 해결
- [아키텍처](ARCHITECTURE.md) — 구성 요소, 데이터 흐름, 상태, 설계 결정
- [OpenClaw 연동](docs/openclaw.md) — MCP 및 실시간 watch 연동
- [버전 관리](VERSIONING.md) — 릴리즈 형식과 자동화
- [영문 README](README.md) — 이 문서의 영문 원본

## 영감

이 프로젝트는 [steipete](https://github.com/steipete)와 그의
[imsg](https://github.com/steipete/imsg), 그리고
[OpenClaw](https://github.com/openclaw/openclaw)에서 큰 영감을 받았습니다.

## 라이선스

`kmsg`는 [MIT License](LICENSE)로 제공됩니다.
