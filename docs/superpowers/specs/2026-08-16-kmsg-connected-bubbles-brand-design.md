# kmsg Connected Bubbles 브랜드 리디자인 명세

- 상태: 승인된 디자인
- 작성일: 2026-08-16
- 대상 제품: kmsg
- 우선 적용 surface: GitHub README, project website, 32px site header
- 디자인 방향: Connected Bubbles

## 1. 배경

`kmsg`는 macOS용 비공식 KakaoTalk CLI이자 native MCP server다. 현재 1000×1000 JPEG 로고는 yellow 배경 위 캐릭터성 강한 입체 이미지를 사용한다. 이 이미지는 제품의 친근함은 전달하지만 다음 문제가 있다.

- 캐릭터와 장식이 많아 32px header에서 형태가 뭉개진다.
- CLI, MCP, message bridge라는 제품 역할보다 mascot이 먼저 인지된다.
- JPEG라 투명 배경, 단색, reverse variant를 제공하지 못한다.
- README, favicon, web manifest, Open Graph image가 하나의 정사각 JPEG에 의존한다.
- 기존 favicon은 단일 KakaoTalk형 말풍선에 가까워 kmsg 고유의 연결 구조가 드러나지 않는다.

리디자인은 KakaoTalk을 연상시키는 yellow palette만 계승하고, 기존 알·캐릭터 motif와 입체 표현은 제거한다.

## 2. 디자인 목표

1. **Message bridge를 즉시 표현한다.** 두 endpoint 사이에서 메시지가 오가는 제품 역할을 연결된 말풍선으로 나타낸다.
2. **작은 크기에서 식별된다.** 32px site header와 favicon에서도 두 말풍선과 연결 관계가 구분되어야 한다.
3. **친근하지만 mascot은 아니다.** Slack·Discord 계열의 둥근 communication mark처럼 접근 가능하되, 얼굴·눈·감정 표현은 사용하지 않는다.
4. **모든 주요 surface에 확장된다.** app icon, transparent symbol, horizontal signature, mono, reverse asset이 같은 geometry를 공유한다.
5. **기존 website token과 충돌하지 않는다.** 현재 dark·paper theme의 yellow, ink, neutral palette를 그대로 활용한다.

## 3. 핵심 컨셉

### 3.1 의미

Connected Bubbles는 서로 다른 방향을 보는 두 말풍선 loop가 중앙에서 interlock되는 구조다.

- 두 말풍선: 사용자와 KakaoTalk, 또는 AI agent와 사용자
- 반대 방향의 꼬리: 양방향 읽기·전송
- 중앙 interlock: CLI/MCP가 제공하는 안정적인 bridge
- 열린 내부 공간: 메시지 내용과 사용자 통제권

### 3.2 시각적 성격

- 친근함: 큰 corner radius와 완만한 곡선
- 기술적 신뢰: 일정한 stroke와 정렬된 geometry
- 절제: flat vector, 최대 두 색
- 독립성: KakaoTalk의 단일 말풍선 silhouette를 복제하지 않고 이중 interlock 구조를 사용

### 3.3 금지 요소

다음 요소는 사용하지 않는다.

- 얼굴, 눈, 입, 알, 동물형 mascot
- 3D extrusion, bevel, gloss, texture, drop shadow
- gradient 또는 빛 번짐
- 점 세 개로 구성된 typing indicator
- KakaoTalk 로고와 동일하거나 혼동 가능한 단일 말풍선 silhouette
- symbol 내부의 `K`, `M`, `>` 같은 문자·terminal glyph

## 4. Symbol geometry

### 4.1 Master grid

- 기준 canvas: 1024×1024
- 시각 중심: `512, 512`
- 기본 stroke: 96px
- stroke cap: round
- stroke join: round
- optical overshoot 허용 범위: 8px 이하
- mark 전체 bounding box 목표: `144, 224`부터 `880, 800`까지

### 4.2 두 말풍선

각 말풍선은 동일한 384×304 rounded body를 기반으로 하되 좌우 반전한다.

- Left bubble body 중심: `392, 456`
- Right bubble body 중심: `632, 568`
- body corner radius: 112px
- Left tail: body의 좌하단에서 바깥쪽으로 104px 연장
- Right tail: body의 우상단에서 바깥쪽으로 104px 연장
- 두 body의 중심 간 offset: x 240px, y 112px
- 내부 counter의 최소 폭: 176px

두 outline은 중앙에서 두 번 교차한다. 한 교차점에서는 left loop를 전면에, 다른 교차점에서는 right loop를 전면에 배치해 chain처럼 상호 연결된 관계를 만든다. 후면 stroke는 교차점 중심에서 stroke 폭의 1.35배 길이만큼 clip해 겹침을 명확히 한다.

### 4.3 Small-size correction

- 32px 이상: master geometry 그대로 사용
- 16–24px: stroke를 104px equivalent로 보정하고, 교차부 clip 길이를 stroke 폭의 1.15배로 줄인다.
- 16px에서 두 counter 중 하나라도 2px 미만이 되면 실패로 판정한다.
- pixel hinting을 위한 수동 직선화는 허용하지만 전체 silhouette와 tail 방향은 바꾸지 않는다.

## 5. Color system

| Token | HEX | 용도 |
| --- | --- | --- |
| `kmsg-yellow` | `#FEE500` | app icon 배경, primary accent |
| `kmsg-yellow-paper` | `#F2D500` | paper theme의 넓은 면적 yellow |
| `kmsg-ink` | `#19170D` | yellow 위 primary symbol, dark text |
| `kmsg-paper` | `#F7F7F2` | dark theme의 reverse symbol |
| `kmsg-readable-gold` | `#756600` | light background 위 접근 가능한 text accent |
| `kmsg-white` | `#FFFFFF` | 사진·짙은 배경 위 reverse asset |

규칙:

- `#FEE500` 위 symbol은 `#19170D`를 사용한다.
- light background 위 yellow text는 금지하고 `#756600`을 사용한다.
- dark background 위 primary symbol은 `#FEE500` 또는 `#F7F7F2`를 사용한다.
- symbol 한 개 안에 세 가지 이상의 색을 사용하지 않는다.
- 색으로만 두 말풍선을 구분하지 않는다. interlock geometry가 관계를 설명해야 한다.

## 6. Wordmark와 signature

### 6.1 Wordmark

- 표기: 항상 lowercase `kmsg`
- typeface: Geist Variable
- weight: 700
- optical size: display에 맞춘 기본값
- letter spacing: `-0.055em`
- 색상: `kmsg-ink`, `kmsg-paper`, 또는 `kmsg-white`
- release SVG에서는 font dependency가 남지 않도록 glyph를 path로 변환한다.

별도 custom lettering은 만들지 않는다. 제품명 가독성과 기존 website typography의 연속성을 우선한다.

### 6.2 Horizontal signature

- 배열: symbol 왼쪽, wordmark 오른쪽
- symbol 높이: wordmark x-height의 1.45배
- symbol과 wordmark 간격: symbol stroke 폭의 1.1배
- 전체 정렬: optical center 기준
- 최소 표시 높이: 24px
- README 권장 폭: 220px

## 7. App icon

- canvas: 1024×1024
- background: `#FEE500`
- rounded rectangle: `x=32`, `y=32`, `width=960`, `height=960`, `rx=216`
- symbol: `#19170D`
- symbol bounding box: 최대 696×560
- outer safe area: 모든 방향 144px 이상
- shadow, border, inner glow 금지

OS가 별도 mask를 적용하는 surface에서는 background squircle 없이 symbol-only asset을 사용한다.

## 8. Asset contract

### 8.1 Editable source

```text
assets/brand/source/
├── kmsg-symbol-primary.svg
├── kmsg-symbol-mono.svg
├── kmsg-symbol-reverse.svg
├── kmsg-symbol-small-ink.svg
├── kmsg-signature-light.svg
├── kmsg-signature-dark.svg
├── kmsg-app-icon.svg
└── kmsg-social-preview-1200x630.svg
```

- `kmsg-symbol-primary.svg`: dark surface용 `#FEE500` mark
- `kmsg-symbol-mono.svg`: light surface용 `#19170D` mark
- `kmsg-symbol-reverse.svg`: 짙은 사진·색상 surface용 `#FFFFFF` mark
- `kmsg-signature-light.svg`: light background용 ink wordmark
- `kmsg-signature-dark.svg`: dark background용 paper wordmark

### 8.2 Rendered output

```text
assets/brand/png/
├── kmsg-symbol-primary-1024.png
├── kmsg-symbol-mono-1024.png
├── kmsg-symbol-reverse-1024.png
├── kmsg-app-icon-1024.png
├── kmsg-app-icon-512.png
├── kmsg-app-icon-192.png
├── kmsg-app-icon-64.png
├── kmsg-app-icon-32.png
├── kmsg-app-icon-16.png
├── kmsg-signature-light-220.png
├── kmsg-signature-dark-220.png
└── kmsg-social-preview-1200x630.png
```

### 8.3 Review package

```text
assets/brand/review/
├── kmsg-connected-bubbles-review-1280x1024.png
└── kmsg-connected-bubbles-size-test-1280x1024.png
```

Review board는 다음을 한 화면에 포함한다.

- primary app icon
- transparent primary symbol
- mono와 reverse variant
- horizontal signature
- 1200×630 social preview crop
- 16, 24, 32, 64, 128px size row
- dark와 paper background 적용 예시
- 기존 로고와 신규 로고의 32px 비교

## 9. Repository integration

승인된 asset은 다음 surface에 적용한다.

- `README.md`, `README.en.md`: 기존 `assets/kmsg-logo.jpg` 참조를 `picture` 기반 light·dark horizontal signature로 교체
- `site/app/components/site-header.tsx`: 32px small-size symbol 적용
- `site/public/assets/favicon.svg`: small-size symbol geometry로 교체
- `site/scripts/build-static.mjs`: manifest icon과 정적 복사 목록을 신규 PNG/SVG로 전환
- `site/app/routes/page.tsx`: Open Graph image를 `kmsg-social-preview-1200x630.png`로 전환
- `site/test/*.test.mjs`: 변경된 asset contract 검증

`assets/kmsg-logo.jpg`는 새 asset 적용이 완료되고 모든 참조가 제거된 뒤 삭제한다. 교체와 삭제는 같은 implementation change에서 수행해 broken link가 생기지 않게 한다.

## 10. 접근성 및 인지성 기준

1. app icon의 `#FEE500`/`#19170D` 조합은 WCAG 계산 기준 14.04:1의 명도 대비를 유지한다.
2. paper theme에서 yellow는 본문 text color로 사용하지 않는다. `#756600`/`#F7F5ED` 조합은 5.26:1 이상을 유지한다.
3. logo image의 `alt`는 맥락에 따라 `kmsg` 또는 빈 문자열을 사용한다. 옆에 `kmsg` text가 있으면 중복 낭독을 막기 위해 `alt=""`를 유지한다.
4. symbol은 색상 없이 mono 상태에서도 두 말풍선과 interlock이 구분되어야 한다.
5. 16·24·32px raster preview를 실제 픽셀 크기로 검토한다. 확대 preview만으로 승인하지 않는다.
6. favicon은 dark·paper browser chrome 모두에서 외곽이 사라지지 않아야 한다.

## 11. 검증 방법

### 11.1 Asset validation

- 모든 SVG가 XML parser를 통과한다.
- 모든 SVG에 올바른 `viewBox`가 있고 외부 image/font 링크가 없다.
- release wordmark는 path로 변환되어 있다.
- PNG dimension과 alpha channel을 script로 검증한다.
- transparent symbol PNG의 corner pixel alpha는 0이어야 한다.
- social preview PNG는 정확히 1200×630이어야 한다.

### 11.2 Visual QA

- 1280×1024 review board를 Telegram에 직접 첨부한다.
- 32px header crop을 1×로 확인한다.
- 16·24·32·64·128px size row에서 tail과 interlock을 검사한다.
- dark background, paper background, yellow app icon을 모두 확인한다.
- 기존 로고 대비 새로운 mark가 mascot이 아닌 message bridge로 읽히는지 검토한다.

### 11.3 Repository QA

- `swift build`
- `cd site && npm test`
- build output에서 기존 `kmsg-logo.jpg` 참조가 남지 않았는지 검색
- site header, manifest, favicon, README image 경로가 실제 파일과 일치하는지 확인

## 12. 수용 기준

다음 조건을 모두 만족해야 완료다.

- Connected Bubbles가 두 말풍선과 중앙 bridge로 인지된다.
- 32px에서 두 counter, 두 tail, interlock이 구분된다.
- primary, mono, reverse가 같은 silhouette를 유지한다.
- 220px horizontal signature에서 `kmsg`가 즉시 읽힌다.
- dark·paper theme에서 symbol이 배경과 분리된다.
- SVG source, required PNG sizes, 1200×630 social preview, 1280×1024 review board가 모두 생성된다.
- README, site header, favicon, manifest, Open Graph asset이 신규 시스템을 참조한다.
- `swift build`와 `site/npm test`가 통과한다.
- 신규 asset은 외부 font·image URL에 의존하지 않는다.
- `assets/kmsg-logo.jpg`의 repository 참조가 0개다.

## 13. 범위 제외

이번 리디자인에 포함하지 않는다.

- 제품명 `kmsg` 변경
- CLI output의 ASCII logo 추가
- website 전체 layout 또는 typography redesign
- KakaoTalk 공식 branding처럼 보이게 하는 endorsement 표현
- motion logo, Lottie, video ident
- 인쇄용 brand guideline PDF

## 14. 결정 기록

- 제품 인상: 친근하고 연결 중심의 message bridge
- 유지 요소: KakaoTalk을 연상시키는 yellow palette
- 제거 요소: 알·캐릭터 motif와 3D 장식
- 참고 계열: Slack·Discord의 communication mark
- 우선 surface: GitHub README와 project website
- 선택 방향: Connected Bubbles
