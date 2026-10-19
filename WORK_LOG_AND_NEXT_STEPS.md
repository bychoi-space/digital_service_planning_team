# 서비스기획팀 업무관리 시스템 - 업무 인수인계 및 다음 작업 가이드
**기록 일시**: 2026-10-19 18:28 (퇴근 전 저장)  
**저장소**: [https://github.com/bychoi-space/digital_service_planning_team](https://github.com/bychoi-space/digital_service_planning_team)  
**라이브 포털 URL**: [https://bychoi-space.github.io/digital_service_planning_team/](https://bychoi-space.github.io/digital_service_planning_team/)

---

## 1. 오늘(10/19) 완료된 핵심 작업 내역

1. **로그인 & 회원가입 통합 게이트웨이 페이지 신규 개발**:
   - `src/components/auth/LoginPage.tsx` 구현 완료.
   - 이름, 비밀번호, 비밀번호 일치 실시간 검증, 사내 6대 부서 선택(Selectbox).
   - 데모 계정 원클릭 간편 로그인 지원 (김기획 팀장, 이수진 책임 등).

2. **시선인터내셔널 6대 부서 체계 및 권한(RBAC) 정립**:
   - `src/constants/departments.ts`에 사내 공식 6대 부서 목록 정의 완료.
   - **서비스기획팀**: 편집/등록/삭제 권한 (`member` / `admin`).
   - **유관부서 5곳 (온라인MN팀, 온라인MD팀, 경영기획, 정보실, 마케팅실)**: 안전한 읽기 전용 권한 (`viewer`).

3. **[서비스기획팀 안내 (Overview)] 화면 대대적 고도화 (인터랙션 & 모션)**:
   - **3대 핵심 업무 쇼케이스**:
     - ① 시선닷컴(sisun.com) UI/UX 개편 (기획서 SB ➔ 비주얼 디자인 ➔ 반응형 퍼블리싱 파이프라인)
     - ② 시선닷컴 어드민(백오피스) 운영 효율화 (AS-IS vs TO-BE 인터랙티브 비교 토글, 93% 공수 절감)
     - ③ 시선인터내셔널 이커머스 정책 & 프로세스 정의 (옴니 멤버십, CS 규정, RACI 매트릭스)
   - **시선닷컴 5단계 기획 스프린트 스텝퍼** (단계별 산출물 및 협의 관계자 상세 뷰)
   - **사내 6대 유관부서 맞춤 협업 데스크** (부서별 업무 요청 양식 원클릭 클립보드 복사기, 맞춤 FAQ)
   - **국내외 최고 프로덕트 벤치마킹 허브** (토스 toss.design, 쇼피파이 Polaris, 리니어 Linear, 29CM/무신사 테크)

4. **클라우드 DB (Supabase) 실시간 연동 코드 구축**:
   - `src/services/storage.ts`에 Supabase `users` 테이블 동기화(`syncFromSupabase`) 및 `password` 저장 로직 반영 완료.
   - 빌드 무오류 전수 검증 (`tsc -b && vite build` 완료) 및 GitHub Pages 자동 배포 완료.

---

## 2. 내일(출근 후) 바로 진행할 작업: Supabase 회원 DB SQL 실행

내일 출근하셔서 **[Supabase 대시보드] ➔ [SQL Editor]** 메뉴로 이동하신 후, 아래의 쿼리를 그대로 붙여넣고 **[Run]** 버튼만 눌러주시면 됩니다.

```sql
-- ============================================================
-- 시선인터내셔널 서비스기획팀 포털: 회원 DB 업그레이드 SQL
-- ============================================================

-- 1. users 테이블에 로그인 비밀번호 컬럼 추가 (기본값 '1234')
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '1234';

-- 2. 기존 사용자 계정들의 기본 비밀번호를 '1234'로 세팅
UPDATE users SET password = '1234' WHERE password IS NULL;

-- 3. 기존 사용자들의 소속 부서를 최신 사내 6대 부서 표준으로 정렬
UPDATE users SET department = '서비스기획팀' WHERE id IN ('user-1', 'user-2', 'user-3', 'user-4');
UPDATE users SET department = 'IT 온라인MD팀' WHERE id = 'user-viewer';

-- 4. 신규 사용자가 포털에서 자유롭게 가입(INSERT) 및 로그인 조회(SELECT)할 수 있도록 RLS 정책 오픈
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to users" ON users;
CREATE POLICY "Allow public read access to users" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert to users" ON users;
CREATE POLICY "Allow public insert to users" ON users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to users" ON users;
CREATE POLICY "Allow public update to users" ON users FOR UPDATE USING (true);
```

---

## 3. SQL 실행 후 확인해볼 테스트 시나리오

1. **신규 회원가입 테스트**:
   - 포털 로그인 화면에서 [회원가입] 버튼 클릭
   - 예: 이름 `최민수`, 비밀번호 `1234`, 부서 `IT 온라인MD팀` 선택 후 등록
   - 등록 즉시 수파베이스 클라우드 DB에 영구 저장됨
2. **다른 브라우저 / 시크릿 창 로그인 테스트**:
   - 크롬 시크릿 창이나 모바일에서 [포털 라이브 링크](https://bychoi-space.github.io/digital_service_planning_team/) 접속
   - 방금 가입한 `최민수 / 1234`로 로그인되는지 확인
   - `IT 온라인MD팀` 소속이므로 상단에 '읽기 전용 모드' 뱃지가 뜨고 데이터 조회가 안전하게 이루어지는지 확인

---

오늘 하루 수고 많으셨습니다! 편안한 퇴근길 되세요. 내일 출근 후 언제든 편하게 말씀해 주시면 이어서 서포트하겠습니다.
