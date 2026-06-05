# EmberRoom (모닥방)

공부할 때 켜놓는 따뜻한 디지털 독서실. 이 저장소는 **핵심 장면 — "앱을 나가면 내 캐릭터도 폰을 봅니다" — 을 화면녹화해 SNS로 바이럴하기 위한 인터랙티브 프로토타입**입니다. (랜딩페이지 검증 방식은 폐기하고 영상 우선 GTM으로 전환했습니다.)

아트 방향은 힐링 게임 「고양이 스프」풍 **부드러운 2D 수채 손그림**이며, 정적 이미지가 아니라 **잔잔한 ambient 애니메이션**으로 "조용히 살아있는" 느낌을 줍니다.

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 을 엽니다. 세로 9:16 무대가 화면 가운데에 뜹니다.

## 사용법

- **상태 버튼**(공부 / 폰 보는 중 / 휴식 / 완료): 캐릭터 포즈·말풍선·분위기가 전환됩니다.
- **데모 재생**: 공부 → (앱 이탈) 폰 → 복귀 → 완료를 자동으로 한 컷 재생합니다(촬영용).
- **녹화 모드**: UI를 숨기고 무대를 풀스크린으로 띄웁니다(Esc로 종료). 그대로 화면녹화하면 됩니다.
- **실제 앱 이탈 감지**: 탭을 전환하거나 창을 벗어나면 캐릭터가 실제로 폰을 보는 상태로 바뀝니다.

## 에셋

`public/assets/` 슬롯에 이미지를 넣으면 자동으로 인식합니다(없으면 임시 폴백 → 카드 플레이스홀더). 슬롯 안내는 [`public/assets/README.md`](public/assets/README.md).

- `scene/library_bg_portrait.png` — 공부방 배경(9:16, 불투명)
- `character/me_study.png`, `character/me_phone.png` — 내 캐릭터(투명 PNG)

> 투명 배경이 아닌(흰/체커보드 배경) 캐릭터 PNG는 중립색 배경을 제거해 투명 컷아웃으로 만드는 파이프라인을 사용했습니다.

## 검사 명령어

```bash
npm run lint
npm run typecheck
npm run build
```

## 기술 스택

Next.js (App Router) · TypeScript · Tailwind CSS · Framer Motion
