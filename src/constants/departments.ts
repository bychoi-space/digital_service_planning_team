import type { User } from '../types';

export interface DepartmentOption {
  id: string;
  name: string;
  isPlanningTeam?: boolean;
}

// 시선그룹(시선인터내셔널) 조직도 기준 소속 부서 목록 (순수 부서 명칭만 표기)
export const COMPANY_DEPARTMENTS: DepartmentOption[] = [
  { id: 'dept-plan', name: '서비스기획팀', isPlanningTeam: true },
  { id: 'dept-digital-mkt', name: '디지털마케팅실', isPlanningTeam: false },
  { id: 'dept-growth-mkt', name: '그로스마케팅부', isPlanningTeam: false },
  { id: 'dept-online-cx', name: '온라인 CX', isPlanningTeam: false },
  { id: 'dept-digital-info', name: '디지털정보실', isPlanningTeam: false },
  { id: 'dept-mgmt-plan', name: '경영기획 총괄', isPlanningTeam: false },
  { id: 'dept-mgmt-hq', name: '경영관리본부', isPlanningTeam: false },
  { id: 'dept-online-mn', name: 'MI/MO/EBM 온라인MN팀', isPlanningTeam: false },
  { id: 'dept-it-md', name: 'IT 온라인MD팀', isPlanningTeam: false },
  { id: 'dept-logistics', name: '물류운영 총괄', isPlanningTeam: false },
  { id: 'dept-accounting', name: '회계팀', isPlanningTeam: false },
  { id: 'dept-hr', name: 'HR실', isPlanningTeam: false },
  { id: 'dept-strategy', name: '경영전략실', isPlanningTeam: false },
  { id: 'dept-fashion-info', name: '패션정보실', isPlanningTeam: false },
];

// KPI 및 조직 위계 권한 레벨
// - executive_viewer: 상위 임원 전체 열람 전용 (신동휘 사장[경영관리본부], 박종삼/박종상 전무[경영기획 총괄])
// - division_head: 직속 상위 실장 · 최종 평가권자 (유은정 상무[디지털마케팅실])
// - team_lead: 서비스기획팀장 · 1차 평가권자 및 팀 전체 열람 (최범열 차장)
// - team_member: 서비스기획팀 구성원 · 본인 KPI 관리 및 동료 다면평가 참여 (김리아·고범곤·박수민 대리 등)
// - cross_dept: 타 부서/유관부서 임직원 · 무기명 협업 다면평가 참여 전용
export type KpiAccessRole =
  | 'executive_viewer'
  | 'division_head'
  | 'team_lead'
  | 'team_member'
  | 'cross_dept';

const EXECUTIVE_VIEWER_NAMES = new Set(['신동휘', '박종삼', '박종상']);
const DIVISION_HEAD_NAMES = new Set(['유은정']);
const TEAM_LEAD_NAMES = new Set(['최범열']);

export function isTeamLeadName(name?: string | null): boolean {
  return TEAM_LEAD_NAMES.has((name || '').trim());
}

export function resolveKpiAccessRole(
  user?: Pick<User, 'name' | 'department' | 'position' | 'role'> | null
): KpiAccessRole {
  if (!user) return 'cross_dept';
  const cleanName = (user.name || '').trim();
  const cleanDept = (user.department || '').trim();

  if (EXECUTIVE_VIEWER_NAMES.has(cleanName)) {
    return 'executive_viewer';
  }
  if (DIVISION_HEAD_NAMES.has(cleanName)) {
    return 'division_head';
  }
  if (TEAM_LEAD_NAMES.has(cleanName) || user.role === 'admin') {
    return 'team_lead';
  }
  if (cleanDept === '서비스기획팀' || user.role === 'member') {
    return 'team_member';
  }
  return 'cross_dept';
}

export function resolveViewerModeBadgeText(user?: User | null): string | null {
  if (!user || user.role !== 'viewer') return null;
  const kpiRole = resolveKpiAccessRole(user);
  if (kpiRole === 'division_head') {
    return '실장 열람 · KPI 최종평가 권한';
  }
  if (kpiRole === 'executive_viewer') {
    return '상위 임원 열람 모드';
  }
  return '유관부서 읽기 전용 모드 적용 중 (등록/수정 제한)';
}

export function resolveMobileViewerBadgeText(user?: User | null): string | null {
  if (!user || user.role !== 'viewer') return null;
  const kpiRole = resolveKpiAccessRole(user);
  if (kpiRole === 'division_head') {
    return '실장 열람 · 최종평가 모드';
  }
  if (kpiRole === 'executive_viewer') {
    return '상위 임원 열람 모드';
  }
  return '읽기 전용 모드';
}
