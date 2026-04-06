# 슬기로운 방학 요정

초등학생(1~6학년)을 위한 동화풍 방학 퀘스트 앱입니다.

## 기술 스택
- Next.js (App Router)
- Tailwind CSS
- Firebase Auth + Supabase (Database/Storage)
- Lucide React

## 시작하기
1. 의존성 설치
   - `npm install`
2. 환경변수 작성
   - `.env.example`를 복사해 `.env.local` 생성
3. 개발 서버 실행
   - `npm run dev`

## 주요 라우트
- `/login`: 교사 로그인/회원가입 + 학생 초대코드 입력 진입
- `/join?code=...`: 학생 링크 가입 (학생이 아이디/비밀번호 직접 설정)
- `/student?grade=3`: 학생용 일일 미션 화면
- `/teacher`: 교사용 PDF 업로드 + 퀘스트 자동 등록 화면
- `/api/pdf-quests` (POST): PDF 텍스트 추출 후 `quests` INSERT
- `/api/teacher-dashboard` (GET): 학급별 진도율/오늘 생존율 집계
- `/api/game/student-stats` (GET): 학생 XP/도토리/스트릭 조회
- `/api/game/complete-quest` (POST): 퀘스트 완료 + 보상 자동 지급
- `/api/game/shop` (GET): 상점 아이템 목록 + 보유 수량
- `/api/game/purchase-item` (POST): 도토리 차감 후 아이템 구매
- `/api/game/equip-item` (POST): 배경/칭호/동물 아이템 장착
- `/api/game/daily-random-quest` (GET): 오늘의 랜덤 퀘스트 1개 배정/조회

## 인증 동작
- `/student`, `/teacher`는 로그인 보호 라우트입니다.
- 비로그인 상태에서 접근하면 `/login?next=...`로 이동합니다.
- 로그인 성공 시 원래 보려던 페이지로 자동 이동합니다.
- Firebase 환경변수가 있으면 Firebase Auth를 우선 사용하고, 없으면 기존 Supabase Auth로 동작합니다.
- 교사는 `/login`에서 회원가입 후 로그인합니다.
- 학생은 교사가 만든 초대링크(`/join?code=...`)로 들어와서 계정을 직접 생성합니다.

## Firebase 준비
1. Firebase 프로젝트 생성 후 Email/Password 로그인 활성화
2. `.env.local`에 아래 값 입력
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (선택)
3. Firebase CLI 초기화 (`firebase init`) 후 Firestore 보안 규칙 배포
   - `firebase deploy --only firestore:rules,firestore:indexes`
4. 교사 계정으로 로그인 후 `/teacher`에서 학생 초대링크 생성

## Supabase 준비
1. Supabase SQL Editor에서 [schema.sql](supabase/schema.sql) 실행
2. `classes`/`profiles` 기초 데이터 생성
3. Storage 버킷(예: `survival-photos`) 생성

## 기본 폴더 구조
```text
app/
  api/pdf-quests/route.js
  student/page.jsx
  teacher/page.jsx
  layout.jsx
  page.jsx
  globals.css
lib/
  grade-tone.js
  pdf/quest-parser.js
  supabase/client.js
  supabase/server.js
supabase/
  schema.sql
```

## 참고
- 현재 인증은 Firebase 우선(없으면 Supabase fallback)으로 동작합니다.
- 교사/게임 데이터 API는 아직 Supabase 스키마 기준입니다. Firebase 인증 계정으로 로그인하면 화면에서 마이그레이션 안내가 표시됩니다.
- PDF 파서 API는 서버 환경변수 `SUPABASE_SERVICE_ROLE_KEY`가 필요합니다.
- 현재 파싱 규칙은 문장 라인 기반이며, 이후 LLM 파서로 고도화하기 쉬운 구조로 분리해 두었습니다.
- 게임 1단계 보상 규칙:
  - 기본 보상: 퀘스트 타입별 XP/도토리
  - 콤보 보상: 하루 3번째 완료 시 추가 지급
  - 스트릭 보상: 3/7/14일 달성 시 추가 지급
- 게임 2단계 상점 규칙:
  - 도토리로 배경/칭호/동물 아이템 구매
  - 구매 시 `student_inventory` 수량 증가
  - 구매 이력은 `shop_purchase_logs`에 저장
- 게임 3단계 장착 규칙:
  - 장착 가능한 카테고리: `background`, `title`, `companion`
  - 카테고리별 1개만 장착 유지 (`student_equips`)
  - 상점에서 구매 후 장착 가능
- 게임 4단계 미리보기:
  - 학생 화면에서 장착 상태를 숲 카드로 즉시 시각화
  - 배경/칭호/동물 변경이 UI에 바로 반영
- 랜덤 퀘스트/주간 배지:
  - 매일 학생당 랜덤 퀘스트 1개 배정 (`student_daily_quests`)
  - 주간 완료 횟수(5/10/15)에 따라 배지 지급 (`student_weekly_badges`)
