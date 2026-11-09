// 시스템 전역 공통 및 감사(Audit) 베이스 타입
export interface AuditBase {
  id: string;
  createdBy: string;
  createdAt: string; // ISO 8601
  updatedBy: string;
  updatedAt: string; // ISO 8601
}

// 사용자 역할: 관리자(전체권한), 기획팀원(등록/수정/삭제), 유관부서(읽기전용 뷰어)
export type UserRole = 'admin' | 'member' | 'viewer';

export interface User {
  id: string; // 시퀀스 PK (1, 2, 3...)
  name: string; // 성명 (로그인 식별자)
  password?: string;
  role: UserRole;
  department: string;
  position: string;
  email: string;
  avatarColor?: string;
  username?: string; // 하위 호환성 임시 옵셔널
}

// 1. 업무 관리(Task) 관련 타입
export type TaskCategory =
  | '신규기획'
  | '기능개선'
  | '서비스운영'
  | '데이터분석'
  | '협업지원'
  | '정책수립'
  | '기획전';
export type TaskTrack = '기획' | '디자인' | '퍼블리싱';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'backlog' | 'in_progress' | 'review' | 'done' | 'on_hold';

export interface TaskLink {
  title: string;
  url: string;
}

export interface TaskAttachment {
  id: string;
  name: string;        // 원본 파일명 (예: '26FW_기획전_상품리스트.xlsx')
  url: string;         // 다운로드/열람 URL
  storagePath: string; // Supabase Storage 내부 객체 경로
  size: number;        // 파일 크기 (bytes)
  ext: string;         // 확장자 ('xlsx' | 'pptx' | 'pdf' | 'docx' 등)
  uploadedBy: string;  // 업로드 사용자 성명
  uploadedAt: string;  // ISO 8601
}

export interface TaskItem extends AuditBase {
  title: string;
  category: TaskCategory;
  track: TaskTrack; // '기획' | '디자인' | '퍼블리싱'
  assigneeId: string;
  assigneeName: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate: string;
  dueDate: string;
  progress: number; // 0 ~ 100
  description: string;
  links: TaskLink[];
  attachments?: TaskAttachment[];
  // 개인 업무공간(bychoi workspace) · Notion · Figma 통합 연동 필드
  workspaceProjectId?: string;
  period?: string;
  notionUrl?: string;
  figmaUrl?: string;
  jiraUrl?: string;
  artifactUrl?: string;
  themeIndex?: number;
  version?: string;
}

// 2. 휴가 및 부재(Vacation) 관련 타입
export type VacationType = 'annual' | 'morning_half' | 'afternoon_half' | 'special' | 'substitute' | 'other';

export interface VacationItem extends AuditBase {
  userId: string;
  userName: string;
  department: string;
  type: VacationType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  deputyId: string;  // 업무 대행자 ID
  deputyName: string;// 업무 대행자 이름
  contact: string;   // 비상연락처
  notes: string;     // 인수인계 사항 및 사유
}

// 3. KPI 목표 및 평가 관련 타입
export type KpiQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Annual';
export type KpiStatus = 'planning' | 'in_progress' | 'achieved' | 'partially_achieved' | 'missed';
export type KpiTargetScope = 'team' | 'individual';
export type KpiTrack = '기획' | '디자인' | '퍼블리싱';

// 4단계 라이프사이클 프로세스 단계
export type KpiProcessStage =
  | 'draft'               // 작성 중 (팀원)
  | 'alignment_pending'   // 1단계: 목표 합의 대기 (팀장 승인 요청)
  | 'aligned'             // 1단계: 목표 합의 완료 (목표 락)
  | 'quarterly_checkin'   // 2단계: 분기별 점검/조정 진행 중
  | 'peer_review'         // 3단계: 동료 다면평가 진행 중
  | 'leader_eval'         // 4단계-1: 팀장(1차) 평가 진행 중
  | 'director_eval'       // 4단계-2: 실장(2차) 평가 진행 중
  | 'finalized';          // 4단계-3: 최종 평가 완료

// 2단계: 분기별 점검 및 조정 이력
export interface KpiQuarterlyCheckin {
  id: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  currentValue: string;
  progressRate: number;      // 0 ~ 100
  note: string;              // 진행 현황 및 장애요인
  isAdjusted?: boolean;      // 목표치/가중치 조정 발생 여부
  adjustmentReason?: string; // 조정 사유
  reviewedBy?: string;       // 팀장 승인 확인자
  reviewedAt?: string;       // 승인 일시
  createdAt: string;
}

// 3단계: 동료 다면평가 항목
export interface KpiPeerReview {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerTrack?: KpiTrack;   // 평가자 직군
  scoreCollaboration: number; // 협업 태도 및 소통 (1~5점)
  scoreQuality: number;       // 산출물 품질 및 완성도 (1~5점)
  commentGood: string;        // 협업 시 칭찬할 점
  commentImprove: string;     // 보완/발전할 점
  submittedAt: string;
}

// 종합 평가 등급
export type KpiGrade = 'S' | 'A' | 'B' | 'C' | 'D';

export interface KpiItem extends AuditBase {
  year: number;
  quarter: KpiQuarter;
  targetScope: KpiTargetScope;
  ownerId?: string;           // 담당자 ID
  ownerName: string;
  track?: KpiTrack;           // '기획' | '디자인' | '퍼블리싱'
  title: string;
  targetMetric: string;
  targetValue: string;
  currentValue: string;
  weight: number;             // 가중치 (%)
  achievementRate: number;    // 달성률 (%)
  status: KpiStatus;
  linkedTaskIds?: string[];   // KPI 목표별 직접 매핑된 실무 수행 근거(Task) ID 목록

  // 4단계 라이프사이클 프로세스
  stage?: KpiProcessStage;

  // 1단계: 목표 합의
  alignedAt?: string;
  alignedBy?: string;
  alignmentComment?: string;

  // 2단계: 분기별 점검 및 조정 내역
  checkins?: KpiQuarterlyCheckin[];

  // 3단계: 동료 다면평가 내역
  peerReviews?: KpiPeerReview[];
  peerAvgScore?: number;      // 동료평가 환산점수 (예: 5점 만점)

  // 4단계: 직책자 다단계 종합 평가
  selfEvaluation?: string;    // 본인 자가평가 코멘트
  selfScore?: number;         // 본인 자가 채점 (0~100)

  // 4단계-1: 1차 평가 (팀 리더)
  leaderScore?: number;       // 1차 점수 (0~100)
  leaderGrade?: KpiGrade;     // S / A / B / C / D
  leaderComment?: string;     // 팀장 총평
  leaderEvaluatedAt?: string;
  leaderEvaluatorName?: string;

  // 4단계-2: 2차 최종 평가 (상위 실장)
  directorScore?: number;     // 2차 실장 최종 점수 (0~100)
  directorGrade?: KpiGrade;   // 최종 확정 등급
  directorComment?: string;   // 실장 총평
  directorEvaluatedAt?: string;
  directorEvaluatorName?: string;

  // 하위 호환성 필드
  finalEvaluation?: string;
  evaluatorName?: string;
}

// 4. 감사 로그(Audit Log) 관련 타입
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'STATUS_CHANGE';
export type AuditEntityType =
  | 'task'
  | 'vacation'
  | 'kpi'
  | 'auth'
  | 'work_info'
  | 'onboarding'
  | 'policy';

// 8. 시선닷컴 정책서 (Sisun.com Front Policy) 타입
export type PolicyDomain =
  | 'product' // 상품
  | 'member'  // 회원
  | 'order'   // 주문
  | 'display' // 전시
  | 'claim'   // 클레임
  | 'search'  // 검색
  | 'common'; // 공통

export interface PolicyRuleRow {
  id: string;
  classification: string; // 구분 / 조건
  ruleDetail: string;     // 상세 프론트 정책 기준
  exceptionNote?: string; // 예외 / 비고
}

export interface SisunPolicyItem extends AuditBase {
  domain: PolicyDomain;           // 7대 도메인 분류
  subCategory: string;            // 중분류 (예: '멤버십 등급 산정', '반품/교환 배송비')
  code: string;                   // 정책 코드 (예: 'POL-PRD-001', 'POL-CLM-002')
  title: string;                  // 정책명
  summary: string;                // 핵심 정책 한 줄 요약
  description: string;            // 정책 배경 및 프론트 노출 기준 설명
  rules: PolicyRuleRow[];         // 세부 기준 표 (조건별/단계별 규칙)
  frontScreenPath?: string;       // 시선닷컴 실제 적용 경로 (예: 'https://sisun.com/about/gradeText')
  workspaceUrl?: string;          // 연관 기획서 뷰어 URL
  status: 'active' | 'updated';   // 운영중 / 최근개편
  sortOrder: number;              // 도메인 내 노출 순서
}

// 6. 업무 관련 정보 (Work Info) 타입
export interface WorkInfoItem extends AuditBase {
  category: string; // 예: '기본 사항', '참고 정보' 등
  title: string;    // 항목명
  content: string;  // 내용 (멀티라인 텍스트, URL 등)
  note: string;     // 비고
  sortOrder: number;
}

// 7. 신규 입사자 온보딩 (Onboarding Checklist) 타입
export type OnboardingPhase = 'day1' | 'week1' | 'week2' | 'week3_4';

export interface OnboardingChecklistItem extends AuditBase {
  phase: OnboardingPhase;   // 단계: Day 1 / 1주차 / 2주차 / 3~4주차
  category: string;         // 분류: 인프라·권한, 협업 허브, 도메인·시스템, 산출물·프로세스, 실무·오너십 등
  title: string;            // 체크리스트 항목 제목
  description: string;      // 상세 실행 가이드 및 확인 내용
  ownerRole: string;        // 안내·지원 담당 (예: 본인 / 멘토(최범열) / 디자인(박수민)·퍼블(김리아))
  linkLabel?: string;       // 바로가기 버튼 라벨
  linkUrl?: string;         // 내부 해시(#/...) 또는 외부 URL(https://...)
  completed: boolean;       // 완료 체크 여부
  completedBy?: string;     // 완료 체크한 사람 이름
  completedAt?: string;     // 완료 체크 일시 (ISO 8601)
  note: string;             // 진행 메모 및 특이사항 기록
  sortOrder: number;
}

export interface AuditLog {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  entityTitle: string;
  action: AuditAction;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  timestamp: string; // ISO 8601
  summary: string;
  details?: Record<string, { before: unknown; after: unknown }>;
}

// 5. 서비스기획팀 소개 및 안내(Overview) 메타데이터 타입
export interface TeamGuideInfo {
  vision: string;
  mission: string;
  domains: Array<{
    id: string;
    title: string;
    description: string;
    leadName: string;
    services: string[];
    tagColor: string;
  }>;
  processSteps: Array<{
    step: number;
    title: string;
    subtitle: string;
    description: string;
    deliverables: string[];
    stakeholders: string;
  }>;
  collaborationChannels: Array<{
    type: string;
    name: string;
    purpose: string;
    linkOrContact: string;
  }>;
}
