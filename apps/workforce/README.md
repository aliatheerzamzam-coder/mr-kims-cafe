# AI Workforce Office

AI 직원 회사 대시보드 — Mr. Kim's Cafe 본사 내부 도구.

소스 디자인: `~/Downloads/design_handoff_ai_workforce/` (React 프로토타입).

## 개발

```bash
cd apps/workforce
npm install
npm run dev          # http://localhost:5173
npm run build        # apps/workforce/dist/
npm run preview      # 빌드 결과 미리보기
```

## 배포 통합 (Step 6 예정)

`server.js`에서 `/workforce/*` 경로를 `apps/workforce/dist/`로 정적 서빙하고, 카페 admin 인증 미들웨어(`requireAuth`)로 보호.

빌드 산출물(`dist/`)은 git 무시. Railway 배포 시 `npm run build` 후 정적 서빙하는 방식은 Step 6에서 결정.

## 데스크톱 전용

뷰포트 `width=1280` 고정. 모바일 대응 안 함.
