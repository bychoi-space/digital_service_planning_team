# 디지털서비스기획팀 업무관리 포털 (Digital Service Planning Team Portal)

> **사내 서비스기획팀의 업무 효율화, 일정 관리 및 유관부서 협업을 위한 올인원(All-in-One) 포털 시스템**  
> 본 시스템은 **무오류 원칙(Zero Errors)** 및 **비용 0원(Zero Cost)**을 기반으로 설계·구축되었습니다.

---

## 📌 주요 기능 (Core Modules)

1. **서비스기획팀 업무 안내 (Overview)**
   - 팀 비전 및 미션 소개
   - 3대 기획 도메인(커머스/결제, 회원/플랫폼, 데이터/운영정책) 및 담당 서비스 R&R 안내
   - 기획 5단계 협업 프로세스 인터랙티브 가이드 (요구사항 접수 → 화면설계 → 개발협의 → QA검증 → 릴리즈 모니터링)
   - 유관부서 협업 창구 (슬랙, 정기 회의체, 문서 스페이스) 및 팀원 연락처

2. **기획 업무 내역 관리 (Tasks)**
   - 칸반 보드(Backlog, In Progress, Review, Done, On Hold) 및 리스트 테이블 듀얼 뷰 지원
   - 업무 등록/조회/수정/삭제 (CRUD) 및 진척률(0~100%) 프로그레스 트래킹
   - Figma, Confluence, Jira 등 관련 기획 문서 링크 복수 첨부

3. **팀원 휴가 및 부재 관리 (Vacations)**
   - 월간 캘린더 뷰 (휴가자 일정 및 반차 뱃지 시각화)
   - 오늘의 팀원 부재 현황 위젯 및 업무 대행자(대리자) 지정
   - 연차, 반차(오전/오후), 경조사, 대체휴가, 공가 등 휴가 유형별 관리

4. **KPI 목표 수립 및 평가 관리 (KPI)**
   - 연도별/분기별(Q1~Q4, Annual) 목표 수립 및 가중치(Weight %) 관리
   - 종합 가중 달성률 자동 계산 게이지
   - 자가 점검 및 팀장/최종 평가 피드백 코멘트 관리

5. **인증 및 권한 체계 (Role-Based Access Control)**
   - **기획팀원 / 관리자 (Editor / Admin)**: 전체 업무/휴가/KPI 생성, 수정, 삭제 권한
   - **유관부서 (Viewer / Read-Only)**: 모든 화면 조회 가능, 생성/수정/삭제 제한 및 읽기 전용 보호

6. **데이터 무결성 감사 로그 (Audit Trail)**
   - 모든 데이터 변경(CREATE, UPDATE, DELETE, LOGIN) 시 작업자, 일시, 변경 요약이 영구 보존되어 데이터 무결성 및 추적성 보장

---

## 🛠 기술 스택 (Tech Stack)

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Vanilla CSS Design Tokens (기업형 SaaS 테마, 반응형 그리드)
- **Icons**: Lucide Icons
- **Data Layer**: Storage Adapter (LocalStorage 기반 즉시 영속화 & Supabase PostgreSQL 확장 호환 구조)
- **Quality**: TypeScript 엄격 모드 (`strict: true`, `verbatimModuleSyntax`, `noUnusedLocals`) 무오류 빌드

---

## 🚀 로컬 실행 방법 (Quick Start)

```bash
# 1. 저장소 클론
git clone https://github.com/bychoi-space/digital_service_planning_team.git
cd digital_service_planning_team

# 2. 패키지 설치
npm install

# 3. 로컬 개발 서버 실행
npm run dev
# 접속 주소: http://localhost:5173/

# 4. 프로덕션 빌드 및 검증
npm run build
```

---

## 🔒 시스템 규정 및 개발 가이드
자세한 개발 규칙 및 데이터 스키마 명세는 [AGENTS.md](./AGENTS.md) 문서를 참조하십시오.
