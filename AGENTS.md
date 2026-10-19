# 서비스기획팀 업무관리 시스템 (AGENTS.md)

이 문서는 **'서비스기획팀 업무관리 시스템'**의 목적, 핵심 기능, 시스템 아키텍처, 권한 체계 및 개발·배포 시 준수해야 하는 엄격한 개발 규칙을 정의한 문서입니다. 모든 AI 에이전트와 개발자는 시스템 개발 및 유지보수 시 본 문서의 원칙과 지침을 철저히 따라야 합니다.

---

## 1. 시스템 개요 (System Overview)

- **시스템 명칭**: 서비스기획팀 업무관리 포털 (Digital Service Planning Team Portal)
- **시스템 목적**: 
  - 서비스기획팀의 역할과 업무 범위에 대한 사내 안내 및 유관부서 협업 창구 제공
  - 팀원들의 일상 및 중장기 업무 내역(Task)의 등록·수정·삭제 및 진행 현황 체계적 관리
  - 팀원 휴가 및 부재 일정을 공유하여 업무 공백 최소화 및 협업 효율 증대
  - 팀 및 개인별 KPI(목표 수립, 정기 점검, 달성도 평가) 관리
  - 등록자/수정자 감사 로그(Audit Log)를 통한 데이터 무결성 및 추적성 확보
  - 유관부서 담당자를 위한 안전한 '읽기 전용(Viewer)' 모드 지원

---

## 2. 주요 기능 요구사항 (Core Functional Requirements)

### 2.1. 서비스기획팀 업무 안내 (Team & Service Overview)
- 서비스기획팀의 비전, 미션, 조직 구성 및 역할(R&R) 소개
- 주요 기획 도메인 및 담당 서비스 목록, 담당자별 연락 채널 안내
- 기획 업무 프로세스(요구사항 접수 → 기획/설계 → 개발 협의 → QA 검증 → 배포/모니터링) 가이드

### 2.2. 업무 내역 관리 (Task Management)
- **기능**: 업무 항목 등록(Create), 조회(Read), 수정(Update), 삭제(Delete)
- **속성**: 업무명, 카테고리(신규기획, 개선, 운영, 협업, 연구 등), 담당자, 우선순위(긴급, 높음, 보통, 낮음), 상태(대기, 진행중, 검토중, 완료, 보류), 시작일/마감일, 진척률(0~100%), 상세 내용, 관련 링크/문서
- **뷰 모드**: 리스트 뷰, 칸반 보드 뷰, 담당자별 필터 및 기간별 검색 지원

### 2.3. 휴가 일정 관리 (Leave & Vacation Management)
- **기능**: 휴가 일정 등록, 조회, 수정, 취소(삭제)
- **속성**: 대상자, 휴가 유형(연차, 반차(오전/오후), 경조, 대체휴가, 공가 등), 기간(시작일~종료일), 비상연락처 및 대리업무자(업무 대행자) 지정
- **뷰 모드**: 월간 캘린더 뷰, 팀원 부재 현황 타임라인, 중복 일정 시각화 안내

### 2.4. KPI 목표 및 달성 평가 관리 (KPI Management)
- **기능**: KPI 목표 수립(등록), 진행상황 정기 점검(수정), 최종 달성 평가(평가 점수/의견 등록)
- **속성**: 평가 연도/분기, KPI 항목명, 측정 지표(정량/정성), 가중치(%), 목표값, 현재 달성값, 달성률(%), 점검 기록(마일스톤), 자가 평가 및 최종 평가 코멘트
- **보고서**: 분기별/연간 KPI 달성 요약 대시보드

### 2.5. 인증 및 권한 체계 (Authentication & Access Control)
- **간이 인증 시스템**: 이름(사용자명)과 비밀번호를 통한 로그인
- **역할 및 권한(Role-Based Access Control)**:
  - **팀원 / 관리자 (Editor / Admin)**: 모든 데이터의 등록, 수정, 삭제 권한 보유
  - **유관부서 / 게스트 (Viewer / Read-Only)**: 모든 화면에 대한 조회 권한만 부여 (등록/수정/삭제 버튼 비활성화 또는 숨김 처리, API 접근 차단)
- **감사 로그(Audit Trail)**:
  - 모든 데이터(업무, 휴가, KPI)에 `createdBy`(등록자), `createdAt`(등록일시), `updatedBy`(최종수정자), `updatedAt`(최종수정일시) 자동 기록
  - 주요 변경 내역(누가 언제 어떤 값을 변경했는지) 이력 보관

---

## 3. 엄격한 개발 및 품질 관리 원칙 (Strict Engineering Rules)

본 시스템은 **실제 사내 운영 환경에 직접 배포되어 사용**되므로, 아래 규칙을 위반하는 코드는 일체 허용되지 않습니다.

### 3.1. 무오류 원칙 (Zero Errors)
1. **구문 및 스크립트 무결성**:
   - 템플릿 리터럴(백틱 `` ` ``), 따옴표 매칭, 이스케이프 문자 누락을 원천 차단한다.
   - 선언되지 않은 변수 참조(ReferenceError), Null/Undefined 프로퍼티 접근(TypeError)이 발생하지 않도록 옵셔널 체이닝(`?.`) 및 널 병합 연산자(`??`)를 기본 적용한다.
2. **사이드 이펙트(Side Effect) 방지**:
   - 상태(State) 변경 시 불변성(Immutability)을 엄격히 유지하며, 의도치 않은 전역 오염(Global Pollution)을 금지한다.
   - 모듈 간 의존성을 최소화하고, 단일 책임 원칙(SRP)을 준수한다.
3. **엄격한 입력 검증 및 에러 핸들링**:
   - 사용자 입력값에 대한 사전 유효성 검증(Validation)을 반드시 수행한다.
   - 예외 상황 발생 시 사용자 화면이 멈추거나 깨지지 않고, 사용자 친화적인 안내 메시지와 복구 방안을 제시한다.

### 3.2. 사전 분석 및 계획 수립 의무화 (Analysis & Planning First)
- 코드를 작성하기 전에 반드시 기능 요구사항을 면밀히 분석하고 아키텍처, 데이터 스키마, 상태 흐름을 정의한 상세 계획을 수립해야 한다.
- 기존 코드 수정 시 영향 범위(Impact Analysis)를 사전에 파악하여 연계된 기능에 사이드 이펙트가 발생하지 않음을 검증해야 한다.

### 3.3. UI/UX 및 디자인 표준 (Visual & UX Excellence)
- **완성도 높은 비주얼**: 사내 임직원 및 유관부서가 직관적으로 사용할 수 있는 세련되고 전문적인 기업형 대시보드 UI/UX를 제공한다.
- **반응형 및 일관성**: 일관된 컬러 팔레트(Design Tokens), 모던 타이포그래피, 적절한 여백, 명확한 인터랙션 피드백(버튼 호버, 로딩 인디케이터, 모달/토스트 알림)을 제공한다.
- **접근성 및 사용성**: 읽기 전용 모드와 편집 모드를 시각적으로 명확히 구분(배지 표시 등)하여 유관부서 사용자의 혼선을 방지한다.

---

## 4. 데이터 모델 기본 정의 (Data Schema Baseline)

모든 엔티티는 아래의 기본 감사(Audit) 필드를 공통으로 포함합니다:

```typescript
interface AuditBase {
  id: string;              // 고유 식별자 (UUID 등)
  createdBy: string;       // 최초 등록자 이름
  createdAt: string;       // 최초 등록 일시 (ISO 8601)
  updatedBy: string;       // 최종 수정자 이름
  updatedAt: string;       // 최종 수정 일시 (ISO 8601)
}

interface User {
  id: string;
  name: string;
  role: 'admin' | 'member' | 'viewer'; // 관리자, 팀원, 유관부서(읽기전용)
  department: string;
}

interface TaskItem extends AuditBase {
  title: string;
  category: string;        // '기획설계' | '서비스운영' | '데이터분석' | '협업지원' | '기타'
  assignee: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'backlog' | 'in_progress' | 'review' | 'done' | 'on_hold';
  startDate: string;
  dueDate: string;
  progress: number;        // 0 ~ 100
  description: string;
  documentLinks?: string[];
}

interface VacationItem extends AuditBase {
  userName: string;
  type: 'annual' | 'morning_half' | 'afternoon_half' | 'special' | 'substitute' | 'other';
  startDate: string;
  endDate: string;
  deputyName: string;      // 업무 대행자
  notes?: string;
}

interface KpiItem extends AuditBase {
  year: number;
  quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Annual';
  title: string;
  targetMetric: string;    // 측정 기준 및 목표 지표
  targetValue: string;     // 목표 수치/결과
  currentValue: string;    // 현재 진행/달성 수치
  weight: number;          // 가중치 (%)
  achievementRate: number; // 달성률 (%)
  status: 'planning' | 'in_progress' | 'achieved' | 'partially_achieved' | 'missed';
  evaluationComment?: string;
  evaluator?: string;
}
```

---

## 5. 단계별 개발 로드맵 (Development Roadmap)

1. **Step 1 - 아키텍처 및 기술 스택 확정 & 기반 셋업**:
   - 데이터 저장소 전략(LocalStorage / IndexedDB 기반 오프라인/프로토타입 지원 및 API 확장성 확보)
   - 전역 상태 관리 및 라우팅/뷰 전환 구조 설계
   - 공통 스타일 가이드, 컴포넌트(모달, 테이블, 폼, 토스트 등) 토큰 정의
2. **Step 2 - 인증 & 권한 & 감사 로그 프레임워크 구현**:
   - 간이 로그인/로그아웃, 세션 관리
   - 사용자 역할(팀원 vs 유관부서 읽기 전용) 전환 및 인가 제어
   - 공통 감사 로그(Audit Logger) 유틸리티 구축
3. **Step 3 - 서비스기획팀 업무 안내(Overview) 화면 구축**:
   - 팀 소개, 조직/업무 R&R, 기획 프로세스 인터랙티브 가이드
4. **Step 4 - 업무 내역 관리(Task) CRUD 및 보드/목록 뷰 구현**:
   - 업무 등록/수정/삭제 모달, 필터링, 정렬, 검색
5. **Step 5 - 휴가 일정 관리(Vacation) 캘린더 및 부재 현황 구현**:
   - 캘린더 뷰, 휴가 등록/수정/삭제, 부재자 현황 위젯
6. **Step 6 - KPI 관리(목표, 점검, 평가) 대시보드 구현**:
   - 분기/연간 KPI 목표 설정, 달성도 계산기, 평가 피드백 기능
7. **Step 7 - 시스템 전수 검증 및 배포 준비**:
   - 스크립트/구문 오류 전수 검사, 사이드 이펙트 검증, 권한별 동작 테스트
   - 최종 릴리즈 준비 및 가이드 문서화
