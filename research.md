# Mr. Kim's Cafe — 메인 웹사이트 심층 분석 리포트

> 분석 대상: [index.html](index.html) (5,669 lines) + [server.js](server.js) (2,003 lines)
> 도메인: https://mrkimscafe.com/
> 타겟: 이라크 바그다드 Salikh 지역 고객 (영어/아랍어 RTL)
> 분석일: 2026-04-30

---

## 1. 아키텍처 개요

### 1.1 기술 스택
| 레이어 | 기술 |
|--------|------|
| Frontend | Vanilla HTML / CSS / JS (빌드 단계 없음, 단일 [index.html](index.html)) |
| Backend | Node.js ≥ 20, Express 4.18 |
| DB | better-sqlite3 12.8 (동기식, prepared statements, 트랜잭션) |
| 인증 | bcryptjs + 토큰 (sessionStorage / localStorage) |
| 보안 | helmet (CSP), express-rate-limit v8 |
| 실시간 | Server-Sent Events (`/api/orders/stream`) + 4초 폴링 |
| QR | qrcode 패키지 |
| 배포 | Railway 수동 (`railway up`, "배포해" 명령 시에만) |
| 테스트 | @playwright/test 1.59 |

### 1.2 통화 / 언어
- 통화: **IQD** (이라크 디나르), 가격은 천 단위 콤마, 메뉴 평균 4,000–10,000 IQD
- 언어: **EN / AR** 두 가지만 (한국어는 의도적 배제)
- RTL: `html[lang="ar"]` 토글 시 `.en`/`.ar` 클래스 가시성 전환 + `dir="rtl"`

### 1.3 주요 진입점
- `/` → [index.html](index.html) — 고객용 메인
- `/cashier.html` — POS (캐셔)
- `/warehouse.html` — 창고/관리자
- QR 진입: `/?t={qrToken}&table={n}` → `/api/dine-session` 으로 세션 토큰 발급

---

## 2. [index.html](index.html) 구조

### 2.1 디자인 토큰 ([index.html:1-300](index.html#L1-L300))
```css
--green:       #367d4d;
--green-dark:  #285f3b;
--cream:       #f5efe6;
--text:        #1c1c1c;
```
- 폰트: Inter (en) + Noto Sans Arabic (ar), `font-display: swap`
- `.en` / `.ar` 클래스로 동일 DOM에 두 언어 텍스트를 동시 마크업, JS `setLang()` 으로 가시성 토글

### 2.2 페이지 섹션
| 섹션 | 위치 | 핵심 |
|------|------|------|
| Navbar | top, sticky | 로고 + 7개 nav + 언어 토글 + 프로필/로그인 + 장바구니 FAB |
| Hero | [index.html:2481+](index.html#L2481) | 2-column, hero 이미지 (`mrkims_hero_coffee.webp`) eager + fetchpriority=high |
| Split Block 1 | cups.webp | "cups for every mood" |
| Split Block 2 | mug.webp | "mugs that warm the day" |
| Menu | 검색 + 그룹 탭 (drinks/dessert/food/all/favorites) + 12 카테고리 타일 |
| Reserve | 테이블 예약 폼 (날짜/시간/인원/이름/전화) |
| Meeting Room | 25,000 IQD / 2시간, 캘린더 + 6 타임슬롯 |
| About | 브랜드 스토리 |
| Contact | Salikh Baghdad · 7AM–1AM · +964 775 006 0011 · [@mr.kims_cafe](https://instagram.com/mr.kims_cafe) |
| Footer | 저작권 + SNS |

### 2.3 모달 / 오버레이
- **장바구니 드로어** — 우측 슬라이드, 합계 + 체크아웃 버튼
- **사이즈 피커 모달** — S/M/L 선택 (`SIZE_MODS = {S:0, M:3000, L:6000}` IQD 추가)
- **체크아웃 모달** — dine-in / pickup / delivery(=coming soon)
- **결제 모달** — 카드번호 / MM·YY / CVV / 홀더 (현재 PG 미연동, placeholder 던짐)
- **상태 모달** — 3-step 진행 (Received ✓ → Preparing ☕ → Ready 🎉)
- **My Order FAB** — 활성 주문이 있을 때만 표시
- **Auth 모달** — Login / Signup 탭
- **Profile 드로어** — Tier 칩 + 4개 stat tile + 4개 탭(orders/stamps/favs/reservations)
- **Toast** — 우측 상단 알림

---

## 3. Frontend JavaScript 로직

### 3.1 메뉴 데이터
- `menuData`: 12 카테고리 × 평균 4–5개 아이템 = 약 **50개 메뉴**
- 각 아이템: `{name_en, name_ar, desc_en, desc_ar, price (IQD)}`
- `DRINK_CATS` Set: 음료 카테고리만 사이즈 모달 표시
- `groupMap`: 그룹 탭 → 카테고리 매핑 (drinks/dessert/food/all/favorites)
- `searchMenu(q)` / `clearMenuSearch()` — 클라이언트 사이드 필터
- `esc(s)` — innerHTML 삽입 전 XSS 이스케이프 헬퍼

### 3.2 주문 플로우
```
[메뉴 카드 클릭]
   ↓
[음료면 사이즈 모달] → [장바구니 추가]
   ↓
[장바구니 드로어 → 체크아웃 모달]
   ↓
선택: dine-in (QR 세션 필수) / pickup (카드결제) / delivery (coming soon)
   ↓
[confirm 모달] → placeOrder() → POST /api/orders
   ↓
서버: orders 테이블 INSERT + (로그인 시) optionalCustomer 첨부
   ↓
응답: {orderId, orderNumber}
   ↓
localStorage 'kims-active-order' 저장 (TTL 2시간)
   ↓
startStatusPolling(orderId) — 4초마다 GET /api/orders/:id
   ↓
status: new → making → done → (옵션) cancelled
   ↓
done 시: 자동 폰번호 매칭으로 customer 링크 + 1 stamp 적립
```

### 3.3 QR 다인인 세션
- URL: `?t={qrToken}&table={n}` → `POST /api/dine-session` → `sessionToken` 받음
- 세션은 서버 `dine_sessions` 테이블에 저장, 만료 시간 있음
- `extend` 엔드포인트로 갱신 가능
- dine-in 주문 시 sessionToken 필수

### 3.4 결제 (현재 미완성)
```js
processCardPayment() {
  throw new Error('PAYMENT_API_NOT_CONFIGURED');
}
```
**상태: 외부 PG (카드/Zain Cash/Switch) 미연동.** 결제·매출 관련 작업 시 항상 사용자에게 상기시킬 것.

### 3.5 인증 상태
```js
authState = { customer, token, favorites }
saveAuthState() / loadAuthState() / updateAuthUI()
```
- 토큰: `Authorization: Bearer {token}` 헤더
- 저장: localStorage (지속) + sessionStorage (탭 단위)
- 폰 형식: 11자리, 0으로 시작, `xxxx xxx xxxx` 자동 포맷 (`formatPhoneInput`)
- 로그인: phone + password (bcrypt 서버 비교)

### 3.6 프로필 드로어
- **Tier chip**: `{min:5,👑Legend}, {min:3,💎Platinum}, {min:2,⭐Gold}, {min:1,🥈Silver}, {min:0,🥉Bronze}` (받은 무료 음료 수 기준)
- **4 stat tiles**: 누적 주문, 누적 지출, 즐겨찾기 수, 적립 스탬프
- **4 탭**:
  - Orders — `renderOrderHistory()` 주문 내역
  - Stamps — 9-dot 그리드 + 10번째 = 무료 음료 슬롯, `loadStamps()` / `renderStamps()`
  - Favorites — `loadFavorites()` / `renderFavsList()` / `toggleFavorite()`
  - Reservations — `loadMyReservations()` 테이블 + 미팅룸

### 3.7 활성 주문 복원
- `localStorage 'kims-active-order' = {orderId, ts}`
- TTL 2시간 — 페이지 재방문 시 자동으로 status 모달 / FAB 복원
- 만료 또는 status=`done` / `cancelled` 도달 시 정리

---

## 4. Backend ([server.js](server.js))

### 4.1 데이터베이스 (24 테이블)
| 카테고리 | 테이블 |
|----------|--------|
| 시스템 | `settings`, `admin_sessions` |
| 메뉴/원가 | `ingredients`, `recipes`, `size_recipes`, `menu_prices` |
| 재고 | `inventory_history`, `daily_sales` |
| 주문 | `orders`, `order_counter`, `refunds` |
| 고객 | `customers`, `customer_sessions`, `phone_verifications`, `favorites`, `customer_stamps`, `stamp_history` |
| QR/다인인 | `table_tokens`, `dine_sessions` |
| 캐셔 | `cashiers`, `cashier_sessions` |
| 예약 | `reservations`, `meeting_reservations` |
| CS | `contact_messages` |

### 4.2 마이그레이션 패턴
```js
try { db.exec("ALTER TABLE x ADD COLUMN y ..."); } catch {}
```
멱등성 보장, 컬럼 누적 추가 (`category`, `capacity_ml`, `menu_category`, `unit` 등).

### 4.3 미들웨어 스택
1. `helmet()` — CSP 헤더
2. `express.json()` — body 파싱
3. `express.static()` — 정적 자산
4. **Rate limiters** (express-rate-limit v8, localhost 제외):
   - `loginLimiter` — 로그인 brute-force 방지
   - `registerLimiter` — 회원가입
   - `orderLimiter` — 주문 폭주 방지
   - `reservationLimiter`
   - `contactLimiter`

### 4.4 API 엔드포인트 (~60+)

#### 인증
- `POST /api/auth/login`, `/logout`, `/change-password` — 관리자
- `POST /api/cashier/login`, `/logout` — 캐셔
- `GET/POST/DELETE /api/cashiers` — 캐셔 CRUD
- `POST /api/customers/register`, `/login`, `/logout`
- `GET /api/customers/me`, `/reservations`, `/favorites`, `/stamps`
- `POST/DELETE /api/customers/favorites`

#### 주문
- `POST /api/orders` — 주문 생성 (optionalCustomer 미들웨어로 로그인 시 자동 링크)
- `GET /api/orders` / `/api/orders/:id`
- `PUT /api/orders/:id/status` — 상태 변경; **`done` 진입 시 부수효과 발생**:
  - 재고 자동 차감 (`recipes` 기반)
  - 폰번호로 customer 자동 링크
  - 1 스탬프 적립 + `stamp_history` 기록
- `POST /api/orders/:id/refund` — 환불 (overflow 방지: 누적 환불 ≤ 주문 합계)
- `GET /api/orders/stream` — **SSE**, ticket-based auth

#### 재고/원가
- `GET/POST/PUT/DELETE /api/ingredients`
- `POST /api/inventory/adjust`
- `GET /api/inventory/history`
- `GET/POST/PUT /api/recipes`, `/api/size-recipes`
- `GET /api/cost/:menuItem`
- `GET /api/size-sales`

#### 스탬프 / 로열티
- `GET /api/customers/stamps` — **자동 생일 보너스 적용** (`birthday`가 오늘이고 올해 미수령 시 +2 스탬프)
- `POST /api/stamps/earn`, `/redeem`, `/lookup`

#### 예약
- `POST/GET /api/reservations` — 슬롯당 최대 4팀
- `GET /api/reservations/availability`
- `POST/GET /api/meeting-reservations` — 25,000 IQD/2hrs
- `GET /api/meeting-reservations/availability`
- `PUT /api/reservations/:id/status`, `PUT /api/meeting-reservations/:id/status`

#### QR / 테이블
- `GET/POST/DELETE /api/table-tokens`
- `GET /api/qr-image` — QR PNG 생성
- `POST /api/dine-session` — 토큰→세션
- `POST /api/dine-sessions/extend`

#### 기타
- `GET /api/dashboard` — 캐셔/관리자 대시보드 통계
- `GET /api/menu-prices`, `GET /api/sales/summary`
- `POST /api/contact` — Contact 폼

---

## 5. 비즈니스 규칙

### 5.1 로열티 시스템
- **9 스탬프 = 1 무료 음료** (10번째 슬롯)
- 적립: 주문이 `done` 진입 시 자동 1 스탬프
- 사용: `redeem` 엔드포인트로 무료 음료 차감
- **Tier 사다리** (받은 무료 음료 누적):
  - 0회: 🥉 Bronze
  - 1회: 🥈 Silver
  - 2회: ⭐ Gold
  - 3회: 💎 Platinum
  - 5회+: 👑 Legend
- **생일 보너스**: 1년 1회 +2 스탬프, 스탬프 fetch 시 자동 적용

### 5.2 자동 고객 링크
주문 생성 시 비로그인 상태여도 폰번호 입력됨. `done` 전환 시 동일 폰번호 customer가 있으면 자동 `customer_id` 첨부 → 누적 통계/스탬프에 반영.

### 5.3 환불 오버플로우 보호
`POST /api/orders/:id/refund`: 누적 환불 합계가 주문 총액 초과 시 거부. `refunds` 테이블에 모든 환불 이벤트 기록.

### 5.4 재고 자동 차감
`done` 진입 시 `recipes` (또는 `size_recipes`) 조회 → 각 ingredient 재고에서 차감 + `inventory_history` INSERT.

### 5.5 예약 제약
- 테이블 예약: 슬롯당 최대 **4팀**
- 미팅룸: 6 타임슬롯, 2시간 단위, 25,000 IQD

---

## 6. 보안

### 6.1 적용 사항
- helmet **CSP** (default-src 등 화이트리스트)
- bcryptjs 비밀번호 해싱 (관리자/캐셔/고객 모두)
- Rate limit 5계층 (login/register/order/reservation/contact)
- localhost는 rate limit 제외 (개발 편의)
- XSS: `esc()` 헬퍼로 innerHTML 삽입 전 이스케이프
- Dine session 만료 시간으로 토큰 재사용 차단
- SSE 스트림 ticket-based 인증

### 6.2 검토 포인트
- 카드결제는 **PG 미연동** → 현재 결제 시도하면 `PAYMENT_API_NOT_CONFIGURED` 에러로 의도적 차단 (실제 카드 정보 처리/저장 코드 없음 — 안전)
- delivery는 "coming soon" 표시로 비활성화

---

## 7. 미해결 / 진행 중 항목

| 항목 | 상태 | 비고 |
|------|------|------|
| 외부 PG 연동 (카드/Zain Cash/Switch) | **미완료** | `processCardPayment` placeholder. 결제·매출 작업마다 사용자 상기시킬 것 |
| Delivery 옵션 | UI에 "coming soon" | 백엔드 라우팅 필요 시 추가 구현 필요 |
| Card payment UI | 모달 마크업 존재 | PG 붙이면 바로 활성화 가능 |

---

## 8. 사용자 여정 요약

### 8.1 비로그인 픽업 주문
1. 메인 진입 → 메뉴 탐색 (검색 / 그룹 탭 / 카테고리)
2. 음료 클릭 → 사이즈 모달 → 장바구니
3. 장바구니 → 체크아웃 → **Pickup** 선택
4. 폰번호 입력 → 결제 모달 → (현재 PG 미연동 메시지)

### 8.2 QR 다인인 주문
1. 테이블 QR 스캔 → `?t=…&table=…` 진입
2. 자동 dine-session 생성 (sessionToken)
3. 주문 → **Dine-in** 자동 선택 → 결제 없이 placeOrder
4. status 폴링 시작 → 음료 준비되면 모달/FAB 알림

### 8.3 회원 (반복 고객)
1. 회원가입/로그인 (phone + password)
2. 즐겨찾기로 빠른 재주문
3. 주문 → 자동 1 스탬프 적립
4. 9 스탬프 도달 → 무료 음료 redeem
5. 누적 무료 음료에 따라 Tier 승급
6. 생일에 자동 +2 스탬프

### 8.4 예약 고객
1. **Reserve** 섹션 → 날짜/시간/인원/이름/전화 → 제출
2. 백엔드: 슬롯 4팀 미만 확인 → 예약 생성
3. 회원이면 프로필 → Reservations 탭에서 확인

### 8.5 미팅룸
1. **Meeting Room** 섹션 → 캘린더 → 날짜 선택 → 6 슬롯 중 선택
2. 25,000 IQD / 2hrs 안내 → 폼 제출
3. 관리자 승인/거절

---

## 9. 코드 핫스팟

| 위치 | 주제 |
|------|------|
| [index.html:1-300](index.html#L1-L300) | 디자인 토큰, .en/.ar CSS |
| [index.html:2481-3300](index.html#L2481-L3300) | 메인 마크업 (hero/menu/reserve/meeting) |
| [index.html:3300-4100](index.html#L3300-L4100) | 메뉴 데이터, 카트, 사이즈 피커, 다인세션 |
| [index.html:4100-4900](index.html#L4100-L4900) | 미팅 캘린더, 검색, 인증, 프로필 |
| [index.html:4900-5669](index.html#L4900-L5669) | 예약, 즐겨찾기, 활성 주문 복원, 모달 마크업 |
| [server.js](server.js) | 24 테이블 + 60+ 라우트, listen at line 1996 |

---

## 10. 결론

**Mr. Kim's Cafe**는 **단일 [index.html](index.html) + Express/SQLite** 구조의 풀스택 카페 운영 시스템이다. 빌드 단계 없이 vanilla JS로 작성되어 있고, **EN/AR 이중언어 + RTL**로 이라크 시장에 맞춰 현지화되어 있다.

핵심 강점은:
1. **QR 다인인 → 결제없이 주문 → 4초 폴링/SSE로 실시간 상태**
2. **자동 재고 차감 + 자동 고객 매칭 + 자동 스탬프 적립**의 부수효과 체인
3. **9-스탬프 로열티 + Tier 5단계 + 생일 보너스**
4. **Helmet CSP + bcrypt + 5단계 rate limit + 환불 overflow 보호**

핵심 과제는:
1. **외부 PG 연동 미완성** — 카드/현지 결제(Zain Cash, Switch) 모두 미연결
2. **Delivery 미구현** — UI는 있으나 백엔드 워크플로 부재

리포트 끝.

---

# 부록 A — 캐셔 POS 시스템 심층 분석 (2026-04-30 추가)

> 분석 대상:
> [cashier.html](cashier.html) (1,124 lines) · [pos-data.js](pos-data.js) (361) · [pos-app.js](pos-app.js) (340) · [pos-views-order.js](pos-views-order.js) (527) · [pos-views.js](pos-views.js) (1,469) · [pos-styles.css](pos-styles.css) (534) · [server.js](server.js) (2,003)
> 진입점: https://mrkimscafe.com/cashier.html

## A.1 시스템 개요

POS는 **캐셔/관리자 단일 페이지 어플리케이션**으로, 모듈 패턴(`MK`, `MK_DATA`, `MKO`, `MKV`)으로 분리되어 있다. 빌드 단계 없이 vanilla JS이며, [cashier.html](cashier.html)이 진입점이고 사이드바에서 7개 뷰(Order/Tables/KDS/Inventory/Reservations/Online/Customers/Reports/Shift/Refund)를 전환한다.

### A.1.1 기술 스택

| 레이어 | 구현 |
|--------|------|
| Frontend | Vanilla JS, 캐시 버스팅 `?v=20260426b` |
| 모듈 분리 | `pos-data.js`(시드/매퍼), `pos-app.js`(코어/i18n/카트), `pos-views-order.js`(주문/결제), `pos-views.js`(테이블/KDS/인벤토리/리포트/환불) |
| 실시간 | **SSE** 단일 사용 ticket(30s TTL) + heartbeat 25s |
| 인쇄 | `window.print` 80mm 영수증 + 주방 티켓 |
| 알림 | UltraMsg WhatsApp API (`0xxx → 964xxx` 변환) |
| i18n | EN/AR만 (한국어 의도적 제거 — 이라크 정책) |

### A.1.2 모듈 구조

```
MK         (pos-app.js)        — 코어, i18n(T), STATE, bus, audit, cartTotals, 인쇄, 내보내기
MK_DATA    (pos-data.js)       — CATS, OPTIONS, MENU, INV, SEED_FLOORS/TABLES, 서버 매퍼
MKO        (pos-views-order.js)— 주문 뷰, 메뉴 그리드, 옵션 모달, 카트, 결제, 영수증 공유
MKV        (pos-views.js)      — 테이블/KDS/인벤토리/예약/온라인/고객/리포트/시프트/환불
```

## A.2 인증·세션 흐름

서버는 **4가지 세션 종류**를 운영한다:

| 종류 | TTL | 갱신 | 저장소 |
|------|-----|------|--------|
| admin | 12h | 자동 | `admin_sessions` |
| cashier | 12h | 자동 | `cashier_sessions` |
| customer | 30d | 자동 | `customer_sessions` |
| dine session | 1h | **비갱신** | `dine_sessions` (QR 발급) |

### A.2.1 캐셔 진입 흐름

1. [cashier.html](cashier.html)에서 인증 오버레이가 모든 뷰를 가린다.
2. `doLogin()`: `username`+`password` → `POST /api/cashier/login` 또는 admin은 `POST /api/auth/login`
3. 응답 `token` → `localStorage['cashier_token']` + `Authorization: Bearer` 자동 첨부
4. `checkAuth()` 매 페이지 로드시 호출 — 만료/없음이면 오버레이 재표시
5. role(`admin`/`cashier`)에 따라 `applyRoleVisibility()` — admin은 환불·시프트·리포트 모두 접근, cashier는 일부 제한

### A.2.2 비밀번호 정책

서버([server.js](server.js)):
- `bcryptjs`, BCRYPT_ROUNDS=10
- **레거시 SHA-256 호환** + **자동 회전**: SHA-256 해시로 검증 성공하면 그 자리에서 bcrypt로 재해시하여 저장
- admin 초기 비번: `ADMIN_INITIAL_PW` env 또는 16자 랜덤 (시드 시 stdout 출력)

## A.3 데이터 영속성 — 서버 vs 클라이언트

| 데이터 | 권위 | 비고 |
|--------|------|------|
| 메뉴 | **클라이언트** (`MK_DATA.MENU`) | 28 SKU 시드 |
| 카테고리/옵션 | **클라이언트** (`CATS`/`OPTIONS`) | |
| 가격 | **서버** (`menu_prices` 테이블) | 클라이언트는 fetch 후 표시 |
| 재고 | **서버** (`ingredients`) | 클라이언트 캐시는 SSE/주기적 fetch로 갱신 |
| 주문(TXNS) | 양쪽 | `mapServerOrderToTxn`으로 정규화 |
| 테이블/층 | **서버** (`tables`, `floors`) | |
| QR 토큰 | **서버** (`table_tokens`) | |
| 고객/스탬프/예약 | **서버** | |
| 시프트 close 결과 | localStorage (캐셔별) | 보고만 |

## A.4 7개 뷰별 동작

### A.4.1 Order 뷰 ([pos-views-order.js](pos-views-order.js))

**3-패널 레이아웃**: 좌(카테고리/검색) · 중(메뉴 그리드) · 우(카트/결제)

- **카테고리 + 검색**: en/ar/ko/sku 모든 필드 매칭 (한국어 검색은 백오피스용으로 살아있음)
- **옵션 모달**: 클릭 시 옵션이 있으면 모달 오픈, 기본값 자동 선택
  - `ice` 옵션 선택 시 `temp='c'` 강제 (얼음=콜드 보장)
- **카트 수학** (`cartTotals` in [pos-app.js](pos-app.js)):
  ```
  subtotal → discount(STUDENT 15%/STAFF 20%/0~50% 직접입력) → tax(10%) → total
  ```
- **분할결제**: 한 주문에 여러 결제수단 합산 가능
- **결제 5종**: cash / card / zaincash / switch / stamps
  - `card`/`zaincash`/`switch`는 **외부 PG 미연동** → 캐셔 수동 처리만 (실제 결제 게이트웨이 호출 없음)
- **`finishPay`**: 서버에 주문 POST → 응답으로 TXNS unshift + 스탬프 가산/차감 + 주방 티켓 인쇄
- **`shareReceiptWA`**: 폰번호 `0xxx → 964xxx` 변환 후 WhatsApp 링크/UltraMsg API 발송

### A.4.2 Tables 뷰 ([pos-views.js](pos-views.js))

- **드래그/리사이즈/회전**: 테이블 박스 자유 배치 (Ctrl+C/V로 복사 붙여넣기)
- **층 탭**: 다층 매장 지원, 층마다 청사진 이미지 업로드 가능 (회전/플립)
- **QR 발급**: 테이블별 QR 코드 생성 → `?t={token}&table={n}` 링크
- 서버 영속화: `tables` / `floors` / `table_tokens` 테이블

### A.4.3 KDS 뷰 (Kitchen Display)

**4-컬럼 다크 테마**: incoming → preparing → ready → done

- 5분 이상 대기는 `urgent` 클래스(빨간 강조)
- **스테이션 라우팅**: SKU 첫 글자로 분기
  - `C/I/T/S` → barista (커피/아이스/티/스무디)
  - `D/F` → kitchen (디저트/푸드)
- 상태 변경 시 SSE 브로드캐스트 → 모든 단말 즉시 동기화

### A.4.4 Inventory 뷰

- **서버 권위적**: 모든 조정은 `POST /api/inventory/adjust`로
- 수령(received) / 조정(adjust) / 소진(consume) 3종
- `capacity_ml` 단위 변환 (1L = 1000ml 자동)
- CSV/XLS 내보내기 지원
- low_stock 임계값(`min_qty`) 미만 시 대시보드 경고

### A.4.5 Reservations 뷰

- 픽업 수락 시 `PK-XXX` 포맷 주문 ID로 TXNS unshift
- 슬롯당 4팀 (테이블) / 1팀 (미팅룸)
- `PUT /api/reservations/:id/status`로 confirm/reject

### A.4.6 Online Orders 뷰

- 메인 사이트([index.html](index.html))에서 들어오는 주문 처리
- `acceptOnlineOrder`: `PUT status=making` + KDS에 푸시
- `rejectOnlineOrder`: cancelled
- 카드 컬러: dine(녹) / pickup(파) / take(주황) / deli(보라)
- `online-flash`: 새 주문 들어오면 우상단 슬라이드 인 토스트

### A.4.7 Customers 뷰

- 검색/필터 + 스탬프 잔량 표시
- CSV/XLS 내보내기

### A.4.8 Reports 뷰

- KPI 카드: 매출/주문수/AOV/환불
- **시간별 막대**: 7시~23시 17개 막대 (그라데이션)
- **결제 도넛**: 5종 결제수단 비율 (SVG)
- Top items 리스트
- `exportAll`: 풀 시트 XLS (Excel 2003 XML Spreadsheet 포맷)

### A.4.9 Shift Close 뷰

- opening / counted / expected / variance 4값
- 임계값: ok(±5%) / warn(±10%) / bad(>10%)
- 결과는 캐셔별 localStorage 저장

### A.4.10 Refund 뷰

- `findRefundOrder(id|number)` → 주문 검색
- 라인별 체크박스로 부분 환불 가능
- `processRefund`: `POST /api/orders/:id/refund` 호출
- 서버에서 **prior refund 합산 검증** + recipe 기반 재고 복원
- 전체 환불 시 주문 상태 → `cancelled`

## A.5 서버 핵심 로직 ([server.js](server.js))

### A.5.1 SSE 단일 사용 티켓 패턴 (서버 1165-1202)

브라우저 EventSource는 커스텀 헤더를 못 보내므로:
1. 클라이언트: `POST /api/orders/stream-ticket` (Bearer 헤더로) → 30초 TTL ticket
2. 클라이언트: `GET /api/orders/stream?ticket={t}` → 검증 후 즉시 ticket 삭제
3. heartbeat 25초마다 `: ping` 전송 (idle timeout 방지)

### A.5.2 POST /api/orders (817-877)

- **QR 검증**: dine session 토큰 매칭
- **자동 customer_id**: optionalCustomer 미들웨어로 로그인 시 자동 첨부
- **트랜잭션**: 주문 INSERT + `order_counter` 증가 + (옵션) 스탬프 atomic
- 응답 후 `broadcastSSE('order:new', ...)` 모든 캐셔에 푸시

### A.5.3 PUT /api/orders/:id/status (908-1045) — 가장 복잡한 라우트

`done` 진입 시 부수효과 체인:

1. **원자적 transitionedToDone 가드**: `WHERE status != 'done'`로 race condition 방지
2. **레시피 기반 재고 차감**: `recipes` + `size_recipes` 조회 → 각 ingredient에서 `qty * portion` 차감 + `inventory_history` INSERT
3. **자동 customer 링크**: 폰번호 매칭 → `customer_id` 첨부
4. **멱등 스탬프 적립**: `uniq_stamp_earn_order` 부분 인덱스로 동일 주문 중복 적립 차단

### A.5.4 POST /api/orders/:id/refund (1048-1162)

- prior refund 합계 + 이번 환불 ≤ 주문 총액 검증 (overflow 방지)
- 라인별 환불 시: 원본 수량 검증 → recipe 기반 재고 **복원**
- isFull 환불이면 주문 status → `cancelled`

### A.5.5 GET /api/dashboard (1817-1842)

- low_stock: `qty < min_qty`
- D-7 expiring: 만료 7일 이내 ingredient
- 시간대: **Baghdad UTC+3** 기준

### A.5.6 GET /api/sales/summary (1862-1966)

- 일별 주문수/매출
- top5 메뉴 (환불 차감 반영)
- 기간 합계

### A.5.7 Stamps API (1612-1697)

- `GET /api/customers/stamps`: **자동 생일 보너스** (`birthday`가 오늘이고 올해 미수령 시 +2 스탬프, `stamp_history`에 기록)
- `POST /api/stamps/earn`: phone fallback (customer_id 없으면 phone 매칭)
- `POST /api/stamps/redeem`: 9 스탬프 = 무료 음료 1잔

### A.5.8 Reservations / Meeting (1699-1815)

- 테이블 예약: 슬롯당 4팀, 12개 슬롯
- 미팅룸: 슬롯당 1팀, 6개 슬롯, 25,000 IQD/2hrs

## A.6 보안 ([server.js](server.js) 496-569)

### A.6.1 helmet CSP (496-513)

```
default-src 'self'
script-src 'self' 'unsafe-inline'  ← inline 스크립트 허용
style-src 'self' 'unsafe-inline'
img-src 'self' data: blob: https:
connect-src 'self' wss: https:
```

### A.6.2 Rate Limiters (525-569)

| 라우트 | 윈도우 | 한도 |
|--------|--------|------|
| `loginLimiter` | 15min | 5 |
| `registerLimiter` | 1h | 3 |
| `orderLimiter` | 1min | 10 |
| `reservationLimiter` | 1h | 5 |
| `contactLimiter` | 1h | 3 |

**localhost(`127.0.0.1`/`::1`) 제외** — 개발/E2E 테스트 편의.

### A.6.3 멱등성 보장

- 스탬프 적립: `uniq_stamp_earn_order` 부분 인덱스
- 주문 done 전환: `WHERE status != 'done'`
- 환불 overflow: prior 합계 검증

### A.6.4 ⚠️ 외부 PG 미연동

`card` / `zaincash` / `switch` 결제는 **캐셔 수동 처리**만 가능. 실제 결제 게이트웨이 호출 코드 없음 → 결제·매출 작업마다 사용자에게 상기시킬 것.

## A.7 i18n 정책

- **EN/AR만**, 한국어 UI 텍스트 절대 금지(이라크 정책)
- `MK.T = { en: {...}, ar: {...} }`만 활성
- `body.mk-rtl` 토글 시 `dir="rtl"` + 아랍어 폰트 (Noto Sans Arabic)
- `applyLang()`: 모든 `.en`/`.ar` 클래스 가시성 + 입력 placeholder 동시 갱신
- 단, 메뉴 검색은 `name_ko`도 매칭함(백오피스 빠른 탐색 위해 살아있음)

## A.8 디자인 시스템 ([pos-styles.css](pos-styles.css))

### A.8.1 색상 토큰

```css
--mk-bg:        #f8f7f3;  /* 배경 크림 */
--mk-primary:   #367d4d;  /* 메인 그린 */
--mk-deep:      #152821;  /* 딥 그린 (사이드바) */
--mk-accent:    #7ed99c;  /* 라이트 그린 액센트 */
--mk-text:      #1c1c1c;
--mk-muted:     #6b7280;
```

### A.8.2 레이아웃 그리드

```css
.pos-root {
  display: grid;
  grid-template-rows: 44px 1fr;
  grid-template-columns: 68px 1fr;
}
/* 탑바(44px) + 사이드바(68px) + 워크스페이스 */
```

### A.8.3 7개 뷰 레이아웃

| 클래스 | 뷰 | 레이아웃 |
|--------|-----|---------|
| `.ov` | Order | 3-panel (좌카테고리/중메뉴/우카트) |
| `.tv` | Tables | 캔버스 + 도구바 |
| `.kv` | KDS | 4-컬럼 다크 |
| `.iv` | Inventory | 좌리스트/우상세 |
| `.rv` | Reservations | 2-컬럼 |
| `.cv` | Customers | 그리드 |
| `.rpt` | Reports | KPI + 차트 |

### A.8.4 모달 시스템

- `.mbk` — 백드롭(반투명 검정)
- `.mb` — 콘텐츠 박스 (기본 500px / `w-md` 420px / `w-lg` 680px)

### A.8.5 폰트

```css
--mk-font-en:  'Inter', system-ui;
--mk-font-ar:  'Noto Sans Arabic', sans-serif;
--mk-font-ko:  'Noto Sans KR', sans-serif;  /* 백오피스 표시용 */
--mk-font-mono:'JetBrains Mono', monospace;
```

## A.9 인쇄 / 내보내기

### A.9.1 80mm 영수증

`MK.printReceipt(order)` — 새 창에서 80mm 폭 CSS, 헤더(로고/주소/전화) + 라인 항목 + 합계 + QR + 푸터, `window.print()` 호출.

### A.9.2 주방 티켓

`MK.printKitchen(order, station)` — barista/kitchen 분리. 장식 최소화, 큰 폰트.

### A.9.3 CSV / XLS

- CSV: `MK.toCSV(rows)` — RFC 4180 escaping (`"` 이중화)
- XLS: **Excel 2003 XML Spreadsheet** 포맷 (Office Open XML 아님)
  - 다중 시트 지원
  - 한국어/아랍어 BOM 처리
  - `Reports.exportAll`은 KPI/시간별/Top items/결제별을 분리된 시트로

## A.10 알려진 제약 / TODO

| 항목 | 상태 |
|------|------|
| 외부 PG 연동(카드/Zain Cash/Switch) | ❌ 미연동 (수동 처리만) |
| Delivery 백엔드 워크플로 | ❌ 미구현 |
| 멀티 매장 | ❌ 단일 매장 가정 |
| 시프트 close 서버 영속화 | ❌ localStorage만 |
| WhatsApp 발송 실패 재시도 | ❌ |

## A.11 핵심 강점 요약

1. **모듈 분리**가 깔끔하다: data/core/order/views 4파일 + 단일 CSS
2. **SSE single-use ticket**으로 EventSource 인증 한계 우회
3. **원자적 가드 + 멱등 인덱스**로 race/중복 방지
4. **레시피 기반 자동 재고 차감 + 환불 시 복원**으로 재고 일관성
5. **자동 고객 매칭 + 자동 스탬프 + 생일 보너스**로 부수효과 체인
6. **EN/AR RTL** + 80mm 영수증 + Excel 2003 XML 다중 시트로 현지화 완성도 높음

## A.12 파일별 라인 수

| 파일 | 라인 |
|------|------|
| [cashier.html](cashier.html) | 1,124 |
| [pos-data.js](pos-data.js) | 361 |
| [pos-app.js](pos-app.js) | 340 |
| [pos-views-order.js](pos-views-order.js) | 527 |
| [pos-views.js](pos-views.js) | 1,469 |
| [pos-styles.css](pos-styles.css) | 534 |
| [server.js](server.js) | 2,003 |

부록 A 끝.

---
---

# Mr. Kim's Cafe — 창고 관리 시스템 (Warehouse) 심층 분석

> **분석 일자**: 2026-04-30
> **분석 대상**: [warehouse.html](warehouse.html) + [server.js](server.js) 의 창고 관련 영역 + SQLite DB
> **분석 범위**: 데이터베이스 스키마, API 엔드포인트, 프런트엔드 구조, 핵심 알고리즘, 보안, 알려진 이슈

## W-1. 시스템 개요

Mr. Kim's Cafe 창고 시스템은 **레시피 기반 자동 재고 차감 + 수동 입출고 관리 + 일일 판매 분석**을 통합한 단일 페이지 백오피스이다. POS([cashier.html](cashier.html))와 동일한 백엔드([server.js](server.js))를 공유하며, 매출이 들어오면 레시피를 따라 ingredient 재고가 자동으로 차감된다.

### 핵심 가치 제안

| 항목 | 설명 |
|------|------|
| **자동 차감** | 사이즈/일반 메뉴별 레시피를 통해 판매 시 ingredient 재고에서 정확한 양만큼 자동 차감 |
| **단위 변환** | `capacity_ml`을 통해 ml/g 단위 ↔ "병 단위" 환산 자동화 |
| **원가 계산** | 레시피 × ingredient.cost 합산으로 실시간 메뉴 원가 산출 |
| **이력 추적** | 모든 입출고 변동을 `inventory_history`에 영구 기록 |
| **다국어** | 기본 RTL(아랍어) · LTR(영어/한국어) 동시 지원 |

## W-2. 기술 스택

### 백엔드 ([server.js](server.js), 약 2,003 라인)
- **런타임**: Node.js + Express.js
- **DB**: better-sqlite3 (WAL 모드, foreign_keys=ON, busy_timeout=5000ms)
- **보안**: Helmet.js, express-rate-limit, bcrypt(rounds=10), SHA-256 레거시 폴백
- **세션**: 토큰 기반 sliding-TTL 12시간
- **외부 연동**: UltraMsg (WhatsApp, 964 이라크 국가코드)

### 프런트엔드 ([warehouse.html](warehouse.html), 약 3,561 라인)
- **프레임워크**: Vanilla JS (의존성 0)
- **시각화**: Chart.js (대시보드 차트)
- **폰트**: Nunito(LTR) + Cairo / Noto Naskh Arabic(RTL)
- **레이아웃**: CSS Grid (280px 사이드바 + 1fr 메인)
- **방향**: 기본 `<html lang="ar" dir="rtl">`, 영어 토글 시 LTR 전환

### 인프라
- **DB 파일**: [cafe-warehouse.db](cafe-warehouse.db) (~1.6 MB) + WAL (~3.9 MB)
- **배포**: Railway (영구 볼륨 마운트, 사용자가 "배포해" 명령 시에만 수동 `railway up`)

## W-3. 데이터베이스 스키마 (창고 영역)

### W-3.1 `ingredients` — 재료 마스터 ([server.js:75](server.js#L75))
```sql
CREATE TABLE ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name_ko TEXT NOT NULL,           -- 표시 이름 (실제로는 영어/아랍어 혼용)
  category TEXT NOT NULL,          -- 시럽/소스/스무디/파우더/과육 등
  unit TEXT NOT NULL,              -- ml, g, ea
  cost REAL NOT NULL,              -- 단위 원가 (IQD)
  current_qty REAL NOT NULL DEFAULT 0,
  capacity_ml REAL DEFAULT 0,      -- ★ 마이그레이션 추가: 병/팩 1개의 ml 용량
  expiry_date TEXT,                -- ★ 마이그레이션 추가
  supplier TEXT,                   -- ★ 마이그레이션 추가
  created_at INTEGER DEFAULT (strftime('%s','now')*1000)
);
```

> **`capacity_ml`의 의미**: `current_qty`가 "병 단위"로 저장되고 레시피가 ml/g 단위로 작성될 때, 차감 시 `recipe_qty / capacity_ml` 비율로 환산된다. `0`이면 단위가 동일하다고 간주하여 직접 차감.

### W-3.2 `recipes` — 일반 메뉴 레시피
```sql
CREATE TABLE recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  menu_item TEXT NOT NULL,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id),
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  UNIQUE(menu_item, ingredient_id)
);
```

### W-3.3 `size_recipes` — 사이즈 차등 레시피 (S/M/L)
```sql
CREATE TABLE size_recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  menu_item TEXT NOT NULL,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id),
  s_qty REAL NOT NULL DEFAULT 0,
  m_qty REAL NOT NULL DEFAULT 0,
  l_qty REAL NOT NULL DEFAULT 0,
  UNIQUE(menu_item, ingredient_id)  -- ★ 마이그레이션으로 추가
);
```

### W-3.4 `inventory_history` — 입출고 이력
```sql
CREATE TABLE inventory_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id),
  ingredient_name TEXT NOT NULL,   -- 비정규화: ingredient 삭제 후에도 이름 보존
  change_type TEXT NOT NULL,       -- 'in' | 'out' | 'adjust' | 'spoil'
  quantity REAL NOT NULL,
  reason TEXT,
  created_at INTEGER DEFAULT (strftime('%s','now')*1000)
);
```

### W-3.5 `daily_sales` — 일일 판매 집계
```sql
CREATE TABLE daily_sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_date TEXT NOT NULL,         -- YYYY-MM-DD
  menu_item TEXT NOT NULL,
  quantity INTEGER NOT NULL,       -- 사이즈 판매도 S+M+L 합산해서 저장
  created_at INTEGER DEFAULT (strftime('%s','now')*1000)
);
```

### W-3.6 마이그레이션 처리 ([server.js:247-323](server.js#L247-L323))
- `ingredients.expiry_date`, `supplier`, `capacity_ml` → 신규 컬럼 추가형 마이그레이션
- `size_recipes` UNIQUE 제약 → 임시 테이블 복사 방식으로 업그레이드
- 모든 마이그레이션은 idempotent: 재시작 시 안전

## W-4. 인증 & 보안

### W-4.1 관리자 비밀번호 시드 ([server.js:325-355](server.js#L325-L355))
1. 환경변수 `ADMIN_INITIAL_PW`가 있으면 그 값으로 bcrypt 해시 저장
2. 없으면 **랜덤 16자** 생성하여 stdout으로 한 번만 출력 (운영자 기록 필수)
3. 기존 DB에 SHA-256("1234") 레거시 해시가 있으면 자동 감지 후 새 비밀번호로 강제 회전

### W-4.2 `requireAuth` 미들웨어 ([server.js:363-379](server.js#L363-L379))
- 헤더 `Authorization: Bearer <token>` 또는 쿠키 `admin_token`
- DB `admin_sessions` 조회 → 만료 시 거부
- **Sliding TTL**: 매 요청마다 `expires_at = now + 12h`로 갱신 → 활동 중 세션 영구 유지

### W-4.3 비밀번호 비교
- bcrypt.compare 사용
- 레거시 SHA-256 해시도 동시 비교 → 매치 시 즉시 bcrypt로 재해시 후 저장 (silent migration)

### W-4.4 Rate Limiting
- 글로벌 + 로그인 엔드포인트 각각 적용
- localhost는 면제 (운영 디버깅 편의)

## W-5. API 엔드포인트 (창고 영역)

> 모든 보호 엔드포인트는 `requireAuth` 통과 필요. 위치는 [server.js:1290-1610](server.js#L1290-L1610).

### W-5.1 Ingredients
| 메서드 | 경로 | 라인 | 설명 |
|--------|------|------|------|
| GET | `/api/ingredients` | 1298 | 전체 재료 조회 |
| POST | `/api/ingredients` | 1303 | 재료 신규 등록 |
| PUT | `/api/ingredients/:id` | 1313 | 재료 수정 |
| DELETE | `/api/ingredients/:id` | 1324 | 재료 삭제 (CASCADE) |
| GET | `/api/ingredients/low-stock` | 1349 | 저재고 알림 |

### W-5.2 Inventory Adjustment
| 메서드 | 경로 | 라인 | 설명 |
|--------|------|------|------|
| POST | `/api/inventory/adjust` | 1357 | 입고/출고/폐기 → history INSERT |
| GET | `/api/inventory/history` | 1379 | 이력 페이징 조회 |
| DELETE | `/api/inventory/history/:id` | 1402 | **삭제 시 `current_qty` 역연산 복구** |

### W-5.3 Recipes & Cost
| 메서드 | 경로 | 라인 | 설명 |
|--------|------|------|------|
| GET | `/api/recipes` | 1427 | 메뉴별 레시피 목록 |
| POST | `/api/recipes` | 1437 | 레시피 추가/수정 (UPSERT via UNIQUE) |
| DELETE | `/api/recipes/:id` | 1452 | 레시피 1줄 삭제 |
| GET | `/api/recipes/cost/:menu` | 1457 | 메뉴 원가 자동 계산 |

### W-5.4 Daily Sales (자동 차감 트리거)
| 메서드 | 경로 | 라인 | 설명 |
|--------|------|------|------|
| POST | `/api/daily-sales` | 1471 | **트랜잭션 내 차감 + 이력 + 집계 동시 기록** |
| GET | `/api/daily-sales` | 1513 | 기간별 판매 조회 |

### W-5.5 Size Recipes & Size Sales
| 메서드 | 경로 | 라인 | 설명 |
|--------|------|------|------|
| GET | `/api/size-recipes` | 1523 | S/M/L 레시피 조회 |
| POST | `/api/size-recipes` | 1533 | 사이즈 레시피 UPSERT |
| DELETE | `/api/size-recipes/:id` | 1558 | 사이즈 레시피 삭제 |
| POST | `/api/size-sales` | 1564 | **사이즈 판매 등록 → S/M/L 별도 차감** |

### W-5.6 Reports / Dashboard
| 메서드 | 경로 | 라인 | 설명 |
|--------|------|------|------|
| GET | `/api/reports/sales-summary` | 1845 | 기간별 매출·판매량 집계 |
| GET | `/api/reports/ingredient-usage` | 1850 | 재료 소비 분석 |

## W-6. 핵심 알고리즘

### W-6.1 일반 메뉴 자동 차감 ([server.js:1492-1499](server.js#L1492-L1499))

```javascript
const deduct = item.capacity_ml > 0
  ? (item.recipe_qty / item.capacity_ml) * sale.quantity
  : item.recipe_qty * sale.quantity;
const newQty = Math.max(0, item.current_qty - deduct);
db.prepare('UPDATE ingredients SET current_qty=? WHERE id=?').run(newQty, item.ingredient_id);
db.prepare('INSERT INTO inventory_history ... VALUES (?,?,?,?,?)').run(
  item.ingredient_id, item.name_ko, 'out', deduct,
  `${sale_date} | ${sale.menu_item} x${sale.quantity}`);
```

**설명**:
- `capacity_ml > 0` → 재고는 "병 단위", 레시피는 ml → 비율 환산
- `capacity_ml = 0` → 재고와 레시피 동일 단위 → 그대로 곱셈
- `Math.max(0, ...)`으로 음수 재고 방지 (단, **경고 미발생** — 알려진 이슈)

### W-6.2 사이즈 메뉴 자동 차감 ([server.js:1591](server.js#L1591))
```javascript
const deduct = s * recipe.s_qty + m * recipe.m_qty + l * recipe.l_qty;
```
**특징**: capacity_ml 환산이 **없음** → 사이즈 레시피는 g 단위로만 작성된다고 가정. 일관성 결여.

### W-6.3 트랜잭션 보장
모든 차감/이력/집계는 `db.transaction(() => { ... })()`로 감싸 **원자성** 보장.

### W-6.4 원가 계산 ([server.js:1457-1468](server.js#L1457-L1468))
`totalCost += recipe.quantity * (ingredient.cost / (ingredient.capacity_ml || 1));`
→ 병 단위 가격이 들어와도 ml 당 원가로 자동 환산.

### W-6.5 이력 삭제 시 재고 복구 ([server.js:1402-1424](server.js#L1402-L1424))
- `change_type === 'in'` 삭제 → `current_qty -= quantity`
- `change_type === 'out' | 'spoil'` 삭제 → `current_qty += quantity`
- 트랜잭션 보장

## W-7. 프런트엔드 구조 ([warehouse.html](warehouse.html))

### W-7.1 레이아웃
```
┌─────────────────────────────────────────────┐
│  Sidebar (280px)         │  Main (1fr)      │
│  Logo                    │  Tab content     │
│  Tabs (8개):             │                  │
│  · Dashboard             │                  │
│  · Ingredients           │                  │
│  · Recipes               │                  │
│  · Adjust                │                  │
│  · Daily Sales           │                  │
│  · History               │                  │
│  · Reports               │                  │
│  · Settings              │                  │
└─────────────────────────────────────────────┘
```

### W-7.2 주요 탭 동작
| 탭 | 핵심 기능 |
|----|----------|
| **Dashboard** | Chart.js로 매출/소비 추이, 저재고 알림 카드 |
| **Ingredients** | CRUD 테이블, capacity_ml/유통기한/공급처 입력 |
| **Recipes** | 메뉴별 레시피 행 추가, 자동 원가 표시 |
| **Adjust** | 입고/출고/폐기 폼 (여러 줄 한꺼번에) |
| **Daily Sales** | 메뉴 + 수량 입력 → POST → 자동 차감 |
| **History** | 이력 검색 + 삭제(복구) |
| **Reports** | 기간 선택 → sales-summary + ingredient-usage |
| **Settings** | 비밀번호 변경, 데이터 백업 |

### W-7.3 디자인 토큰
```css
:root {
  --green: #367d4d;   /* 브랜드 메인 */
  --red:   #e53e3e;   /* 위험/삭제 */
  --orange:#d97706;   /* 경고/저재고 */
  --blue:  #3b82f6;   /* 정보 */
}
```

### W-7.4 RTL 지원
- 기본 `dir="rtl"` 진입 → 사이드바 자동 우측 배치
- 영어/한국어 토글 시 `document.documentElement.dir = 'ltr'` + 폰트 스왑
- 모든 컴포넌트는 `padding-inline-*`, `margin-inline` 등 논리 속성 사용

## W-8. 데이터 흐름 (전체 시나리오)

### 시나리오: 손님이 "Vanilla Latte M 2잔" 주문
```
[POS cashier.html]
  ↓ 주문 확정
[POST /api/orders + 결제]
  ↓ 사이즈 메뉴
[POST /api/size-sales {menu_item: "Vanilla Latte", s:0, m:2, l:0}]
  ↓ server.js:1564 트랜잭션 시작
  ├─ size_recipes JOIN ingredients 조회
  │   → 우유 m_qty=200g, 바닐라시럽 m_qty=15ml ...
  ├─ for each ingredient:
  │   deduct = 0*s_qty + 2*m_qty + 0*l_qty
  │   current_qty -= deduct
  │   inventory_history INSERT (type='out')
  └─ daily_sales INSERT (sale_date, menu_item, quantity=2)
  ↓ COMMIT
[warehouse.html dashboard]
  → 낮아진 재고 반영, 일일 판매 차트 업데이트
```

### 핵심 보장
- **원자성**: 차감/이력/집계 중 한 단계 실패 시 모두 롤백
- **추적성**: 모든 변동이 `inventory_history`에 영구 기록
- **단위 안전성**: capacity_ml을 통한 자동 환산 (일반 메뉴 한정)

## W-9. 알려진 이슈 & 기술 부채

### W-9.1 사이즈 레시피의 capacity_ml 미적용
- 일반 레시피 차감은 `capacity_ml` 환산을 적용하지만 [size 차감(server.js:1591)](server.js#L1591)은 단순 곱셈
- → ml 단위 사이즈 레시피 + "병 단위" ingredient 조합 시 차감량 오차
- **권장 수정**: 사이즈 차감에도 동일한 `capacity_ml > 0 ? recipe_qty/capacity_ml : recipe_qty` 패턴 적용

### W-9.2 음수 재고 무경고 차단
- `Math.max(0, current_qty - deduct)`로 단순 클램프 → 실제 부족해도 판매 등록됨
- **권장 수정**: deduct > current_qty 인 경우 `warnings` 배열에 푸시 후 응답

### W-9.3 한국어 잔존 (i18n 부채)
- `name_ko`, `category` 값이 한국어/영어/아랍어 혼재
- 카테고리 명: `'시럽'`, `'소스'`, `'스무디'`, `'파우더'`, `'과육'`
- 백엔드 메시지에도 한국어: `"사이즈 레시피 없음 → 재고 차감 생략"` ([server.js:1586](server.js#L1586))
- **메모리 정책 위반**: 이라크 고객 대상 → 한국어 절대 금지
- **권장 수정**: 컬럼·enum·메시지를 영어/아랍어로 통일

### W-9.4 거대 단일 파일
- [warehouse.html](warehouse.html) 3,561 라인 — 인라인 CSS + JS 포함
- 권장: cashier 처럼 `warehouse-styles.css`, `warehouse-views.js`, `warehouse-data.js` 분리

### W-9.5 history 삭제 권한
- 관리자 토큰만 있으면 누구든 이력 삭제 + 재고 복구 가능
- 회계 감사 관점에서 위험 → soft-delete + 감사 로그 권장

### W-9.6 외부 PG 미연동 (정책 환기)
- 결제·매출 분석 화면은 작동하지만 **카드/Zain/Switch 연동은 미완료**
- 매출 작업 시 사용자에게 매번 환기 필요

## W-10. 개선 권장사항 (우선순위 순)

### P0 (즉시)
1. **사이즈 차감에 capacity_ml 적용** — 데이터 정합성 직결
2. **한국어 카테고리/메시지 → 영어/아랍어 통일** — 정책 위반 해소
3. **재고 부족 경고 시스템** — 운영 신뢰도 향상

### P1 (단기)
4. **이력 삭제 → soft-delete + 감사 로그**
5. **warehouse.html 모듈 분리** (3,561 → < 800 라인 × 5 파일)
6. **Playwright E2E 테스트 추가** — 차감 정확성, 환산 시나리오

### P2 (중기)
7. **다국어 컬럼 분리**: `name` 단일 컬럼 + `i18n_translations` 별도 테이블
8. **재고 알림 자동화**: 임계치 미만 시 WhatsApp 푸시
9. **백업 자동화**: Railway 볼륨 → S3 일일 스냅샷

## W-11. 결론

창고 시스템은 **"레시피 → 자동 차감 → 이력 → 분석"**의 핵심 루프가 트랜잭션으로 안전하게 묶여 있는, 단일 카페 규모에 충분히 정교한 시스템이다. 특히 `capacity_ml` 기반 단위 환산, sliding-TTL 세션, 레거시 비밀번호 자동 회전 등 **운영 친화적 디테일**이 돋보인다.

다만:
- **사이즈 레시피 차감 일관성**과 **재고 부족 경고**는 데이터 신뢰도 측면에서 즉시 보강 필요
- **한국어 잔존**은 프로젝트 정책 위반이며 영어/아랍어 전환이 시급
- **단일 거대 HTML**은 유지보수성 저하 요인 → cashier와 동일 수준으로 모듈 분리 권장

위 P0 이슈를 해결하면 신뢰도와 정책 준수 측면에서 한 단계 도약 가능하다.

창고 분석 끝.
