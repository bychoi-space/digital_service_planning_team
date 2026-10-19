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
  id: string;
  username: string;
  name: string;
  password?: string;
  role: UserRole;
  department: string;
  position: string;
  email: string;
  avatarColor?: string;
}

// 1. 업무 관리(Task) 관련 타입
export type TaskCategory = '신규기획' | '기능개선' | '서비스운영' | '데이터분석' | '협업지원' | '정책수립';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'backlog' | 'in_progress' | 'review' | 'done' | 'on_hold';

export interface TaskLink {
  title: string;
  url: string;
}

export interface TaskItem extends AuditBase {
  title: string;
  category: TaskCategory;
  assigneeId: string;
  assigneeName: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate: string;
  dueDate: string;
  progress: number; // 0 ~ 100
  description: string;
  links: TaskLink[];
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

export interface KpiItem extends AuditBase {
  year: number;
  quarter: KpiQuarter;
  targetScope: KpiTargetScope;
  ownerName: string;
  title: string;
  targetMetric: string;
  targetValue: string;
  currentValue: string;
  weight: number;          // 가중치 (%)
  achievementRate: number; // 달성률 (%)
  status: KpiStatus;
  selfEvaluation?: string;
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
