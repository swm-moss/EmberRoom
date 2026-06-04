# EmberRoom

모닥방은 공부할 때 켜놓는 감성형 디지털 독서실 앱을 검증하기 위한 단일 랜딩페이지입니다.

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 열면 됩니다.

## 검사 명령어

```bash
npm run lint
npm run typecheck
npm run build
```

## Waitlist 환경변수

백엔드는 포함하지 않았습니다. 폼 제출은 아래 환경변수가 있으면 해당 endpoint로 `POST` 요청을 보냅니다.

```bash
NEXT_PUBLIC_WAITLIST_ENDPOINT=https://example.com/waitlist
```

환경변수가 없으면 브라우저 `localStorage`의 `emberroom_waitlist` 키에 저장됩니다.

## 분석 이벤트

`lib/analytics.ts`의 `trackEvent` 함수가 현재는 `console.log`로 아래 이벤트를 기록합니다.

- `hero_cta_click`
- `secondary_cta_click`
- `sync_state_click`
- `theme_like_click`
- `waitlist_submit`
- `feature_selected`
- `paid_feature_selected`
