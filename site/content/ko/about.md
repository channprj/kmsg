# kmsg 소개

kmsg는 macOS용 KakaoTalk을 터미널과 AI agent에서 다루기 위한 비공식 오픈소스 CLI이자 native MCP server입니다. 메시지 읽기, 새 메시지 감시, 텍스트·이미지 전송을 macOS Accessibility API로 수행하며 KakaoTalk의 비공개 LOCO protocol을 구현하거나 우회하지 않습니다.

## 누구를 위한 프로젝트인가

kmsg는 자신의 Mac에서 반복 작업을 자동화하려는 개발자, 구조화 JSON으로 KakaoTalk 작업을 연결하려는 로컬 도구 제작자, 사용자 승인을 거쳐 메시지를 읽고 보내야 하는 AI agent를 위해 만들어졌습니다. 서버형 SaaS나 대량 메시지 발송 서비스가 아니라 사용자가 직접 소유하고 제어하는 Mac에서 실행되는 local-first 도구입니다.

## 운영 주체와 출처

프로젝트는 CHANN의 박희찬이 공개 GitHub 저장소 `channprj/kmsg`에서 유지합니다. source, issue history, release tag, MIT License, GitHub Actions 결과를 누구나 확인할 수 있습니다. 공식 웹사이트의 canonical URL은 `https://channprj.github.io/kmsg/`이며 release와 설치 정보는 같은 저장소를 기준으로 합니다.

## 설계와 신뢰 경계

kmsg는 KakaoTalk의 화면과 접근성 계층을 사용하므로 실제 실행에는 macOS용 KakaoTalk, 로그인 상태, 해당 binary에 대한 Accessibility 권한이 필요합니다. 계정 정보와 메시지는 사용자의 Mac에서 처리되며 이 정적 웹사이트로 업로드되지 않습니다. 메시지 전송은 외부 상태를 바꾸므로 대상과 payload를 `--dry-run`으로 먼저 확인하는 방식을 권장합니다. background-safe 읽기, bounded search, local credential encryption, 명시적인 MCP tool contract를 통해 자동화가 수행하는 범위를 드러냅니다.

## 독립성과 지원 범위

kmsg는 Kakao Corp.와 제휴하거나 승인받은 공식 제품이 아닙니다. KakaoTalk UI 변경으로 자동화가 영향을 받을 수 있으며 사용자는 대상, 권한, 전송 결과와 관련 정책을 직접 확인해야 합니다. 지원되는 platform, command, MCP transport와 알려진 제한은 이 사이트의 usage, architecture, developer, privacy 문서에 공개합니다. 확인할 수 없는 기업 규모나 보증을 주장하지 않고, 공개 source와 재현 가능한 test를 신뢰 근거로 제공합니다.
