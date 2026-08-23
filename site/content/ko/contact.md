# kmsg 연락처와 지원 안내

kmsg에 관한 버그 신고, 기능 제안, 설치·MCP 연동 질문은 공개 GitHub 저장소를 기본 창구로 사용합니다. 공개 issue를 사용하면 같은 문제를 겪는 사용자가 검색할 수 있고, source revision과 해결 과정이 기록으로 남습니다. 프로젝트는 유료 고객센터나 전화 지원을 운영하지 않으며 응답 시간 보장을 제공하지 않습니다.

## 일반 지원과 버그 신고

[GitHub Issues](https://github.com/channprj/kmsg/issues)에서 새 issue를 작성하세요. 사용한 kmsg version, macOS version, KakaoTalk version, 실행한 command, 기대한 결과, 실제 오류 메시지와 최소 재현 절차를 포함하면 진단에 도움이 됩니다. Accessibility hierarchy나 chat output을 첨부하기 전에는 사람 이름, 채팅 내용, 전화번호, 계정 ID, local path와 credential을 반드시 제거하세요. 반복 가능한 예시는 실제 개인 메시지 대신 synthetic data를 사용하세요.

## 기능 제안과 개발 문의

새 command, JSON field, MCP tool 또는 문서 개선 제안도 GitHub issue에서 논의합니다. 제안에는 해결하려는 실제 작업, 사용자에게 발생하는 side effect, 승인 경계, 실패 시 기대 동작을 적어 주세요. source 수준 질문은 developer resources와 architecture 문서를 먼저 확인하고, 기존 issue와 release note에 같은 주제가 없는지 검색하는 편이 좋습니다.

## 보안과 개인정보 문의

공개하면 안 되는 취약점이나 민감한 개인정보 문제는 공개 issue에 원문을 게시하지 말고 `iam@chann.dev`로 최소 정보만 보내세요. 제목에 `kmsg security` 또는 `kmsg privacy`를 포함하고 영향을 받는 version과 재현 조건을 설명하되, 실제 KakaoTalk password, message history, access token, encryption key는 보내지 마세요. 일반 지원 내용을 이 email로 보낸 경우 공개 issue로 이동해 달라는 안내를 받을 수 있습니다.

## 공식 채널과 확인 방법

공식 source는 `https://github.com/channprj/kmsg`, 공식 site는 `https://channprj.github.io/kmsg/`, maintainer profile은 `https://github.com/channprj`입니다. release binary는 GitHub Releases와 `channprj/tap` Homebrew tap에서 확인하세요. 이 경로와 다른 곳에서 받은 binary나 지원 요청은 프로젝트가 검증할 수 없습니다. 연락처나 policy가 바뀌면 이 페이지와 repository history에 함께 기록합니다.
