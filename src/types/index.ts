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
export type TaskCategory = '신규기획' | '기능개선' | '서비스운영' | '데이터분석' | '협업지원' | '정책수립';
export type TaskTrack = '기획' | '디자인' | '퍼블리싱';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'backlog' | 'in_progress' | 'review' | 'done' | 'on_hold';

export interface TaskLink {
  title: string;
  url: string;
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
  // 개인 업무공간(bychoi workspace) 연동 필드
  workspaceProjectId?: string;
  period?: string;
  figmaUrl?: string;
  notionUrl?: string;
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
export type AuditEntityType = 'task' | 'vacation' | 'kpi' | 'auth';

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
