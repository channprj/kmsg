# kmsg 버전 관리

`kmsg`는 날짜를 포함한 버전을 사용합니다.

```text
MAJOR.YYMMDD.PATCH_COUNT
```

예시:

```text
1.260727.0
```

## 기준 파일

저장소 루트의 `VERSION`이 유일한 기준입니다. 파일에는 선행 `v` 없이 버전만 기록합니다.

빌드 시 SwiftPM 플러그인이 형식을 검증하고 `BuildVersion` 소스를 생성합니다. 따라서 다음 출력은 모두 같은 값을 사용합니다.

- `kmsg --version`
- `kmsg -v`
- `kmsg status`
- 빌드·릴리스 산출물

## 형식

- `MAJOR`: 호환성을 깨는 변화나 주요 이정표에서 수동 증가
- `YYMMDD`: 릴리스 날짜
- `PATCH_COUNT`: 해당 날짜의 첫 릴리스는 `0`, 추가 릴리스마다 1 증가

태그에는 `v`를 붙입니다.

```text
v1.260727.0
```

## 운영 규칙

- 릴리스 태그를 만들기 전에 `VERSION`을 갱신합니다.
- 새 날짜의 첫 릴리스는 `PATCH_COUNT=0`입니다.
- 같은 날 추가 릴리스는 patch count만 증가합니다.
- 날짜가 바뀌면 patch count를 다시 `0`으로 설정합니다.
- 바이너리가 보고하는 버전과 태그가 다르면 릴리스 워크플로가 실패해야 합니다.

## 버전 올리기

`VERSION`을 직접 편집하지 말고 제공된 명령을 사용합니다.

```bash
make release-patch
make release-major
```

실제 변경 전에 dry run으로 확인할 수 있습니다.

```bash
scripts/headatever.sh patch --dry-run
```

릴리스 자동화는 다음을 하나의 흐름으로 처리합니다.

1. 다음 버전 계산과 검증
2. `VERSION` 갱신
3. `chore(release): v<version>` 커밋
4. 주석이 있는 `v<version>` 태그 생성

## 호환성

Swift Package Manager가 인식하는 공개 패키지 버전은 이 형식을 사용합니다. Homebrew tap 동기화는 현재 형식과 이전 semver 태그를 함께 읽어 마이그레이션 중의 과거 릴리스를 보존합니다.

전체 릴리스 절차는 [영문 버전 관리 문서](https://github.com/channprj/kmsg/blob/main/VERSIONING.md)를 참고하세요.
