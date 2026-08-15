# kmsg Brand Assets

Connected Bubbles는 kmsg의 양방향 message bridge 역할을 나타내는 공식 symbol system입니다. 두 말풍선 loop와 반대 방향의 tail, 중앙 open bridge를 모든 variant에서 동일하게 유지합니다.

## 재생성

Site dependency가 설치된 repository root에서 실행합니다.

```bash
cd site && npm ci && cd ..
python3 -m venv /tmp/kmsg-brand-venv
/tmp/kmsg-brand-venv/bin/pip install -r tools/brand/requirements.txt
/tmp/kmsg-brand-venv/bin/python tools/brand/generate_brand_assets.py
cd site && node --test test/brand-assets.test.mjs
```

PNG rendering에는 `rsvg-convert`가 필요합니다. macOS Homebrew 기준 설치 package는 `librsvg`입니다.

## Asset 선택

- `kmsg-app-icon.svg`·`kmsg-app-icon-*.png`: app icon, manifest, site header
- `kmsg-symbol-primary.svg`: dark surface 위 `#FEE500` symbol
- `kmsg-symbol-mono.svg`: light surface 위 `#19170D` symbol
- `kmsg-symbol-reverse.svg`: 짙은 사진·색상 surface 위 white symbol
- `kmsg-symbol-small-ink.svg`: favicon과 16–24px small-size surface
- `kmsg-signature-light.svg`: light background용 horizontal signature
- `kmsg-signature-dark.svg`: dark background용 horizontal signature
- `kmsg-social-preview-1200x630.*`: Open Graph와 social card
- `reference/kmsg-legacy-32.png`: size-test board 전용 legacy 32px comparator

## 사용 규칙

- 일반 icon은 최소 32px로 사용합니다.
- 16–24px에서는 `kmsg-symbol-small-ink.svg` geometry를 사용합니다.
- light background 위 yellow text는 사용하지 않습니다. Text accent는 `#756600`을 사용합니다.
- gradient, shadow, outline effect, mascot face를 추가하지 않습니다.
- symbol의 tail 방향과 두 loop 사이 bridge offset을 변경하지 않습니다.
- Release SVG는 `<text>`와 외부 image·font reference 없이 path로만 배포합니다.

## 비제휴 고지

kmsg는 Kakao Corp.와 무관한 독립 open-source project입니다. Yellow palette는 KakaoTalk 사용 맥락을 설명하기 위한 색상 연결이며 공식 endorsement를 의미하지 않습니다.
